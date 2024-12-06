import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import {
    calculatePlayerPower,
    determineCaptainWinner,
    updateGameResult,
} from '../../logic/gameplay.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// 대장전 게임 세션 생성
const captainGameSession = new Map();

/** 대장전 게임 시작 API = POST로 처리 **/
// 입력할 정보 : 상대할 accountId, 내 TeamMember 중 isSelected된 선수 중 택 1
router.post('/captain/start', authM, async (req, res) => {
    try {
        const myAccountId = req.account.accountId;
        const { opponentManagerId, selectedPlayerIds } = req.body;

        if (!myAccountId) {
            return res.status(401).json({ error: '인증 정보가 없습니다.' });
        }

        if (!selectedPlayerIds || selectedPlayerIds.length !== 3) {
            return res.status(400).json({
                error: '3명의 선수를 순서대로 선택해야 합니다.',
            });
        }

        // 내 매니저 정보 조회
        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(myAccountId) },
        });

        if (!myManager) {
            return res
                .status(404)
                .json({ error: '매니저 정보를 찾을 수 없습니다.' });
        }

        // 자신과의 대결 체크
        if (myManager.managerId === Number(opponentManagerId)) {
            return res.status(400).json({
                error: '자신과는 대결할 수 없습니다.',
            });
        }

        const uniquePlayerIds = [...new Set(selectedPlayerIds)];
        if (uniquePlayerIds.length !== 3) {
            return res.status(400).json({
                error: '중복되지 않은 3명의 선수를 선택해야 합니다.',
            });
        }

        // 내 선택된 선수들 조회
        const mySelectedPlayers = await Promise.all(
            uniquePlayerIds.map(async (playerId) => {
                return await prisma.teamMember.findFirst({
                    where: {
                        managerId: myManager.managerId,
                        playerId: Number(playerId),
                        isSelected: true,
                    },
                    include: {
                        player: true,
                        inventories: {
                            include: {
                                item: true,
                            },
                        },
                    },
                });
            })
        );

        // 선수 유효성 검사
        if (mySelectedPlayers.some((player) => !player)) {
            const availablePlayers = await prisma.teamMember.findMany({
                where: {
                    managerId: myManager.managerId,
                    isSelected: true,
                },
                include: {
                    player: true,
                    inventories: {
                        include: {
                            item: true,
                        },
                    },
                },
            });

            return res.status(400).json({
                error: '선택한 선수 중 유효하지 않은 선수가 있습니다.',
                availablePlayers: availablePlayers.map((member) => ({
                    playerId: member.playerId,
                    name: member.player.name,
                    isSelected: member.isSelected,
                    power: calculatePlayerPower(
                        member.player,
                        member.upgrade,
                        member.inventories?.item
                    ),
                })),
            });
        }

        // 상대방 매니저 정보 조회
        const opponentManager = await prisma.manager.findUnique({
            where: { managerId: Number(opponentManagerId) },
        });

        if (!opponentManager) {
            // isSelected가 true인 선수를 보유한 매니저 목록 조회
            const availableManagers = await prisma.manager.findMany({
                where: {
                    teamMembers: {
                        some: {
                            isSelected: true,
                        },
                    },
                },
                select: {
                    managerId: true,
                    nickname: true,
                    rating: true,
                    teamMembers: {
                        where: {
                            isSelected: true,
                        },
                        include: {
                            player: true,
                        },
                    },
                },
            });

            return res.status(404).json({
                error: '상대방 매니저를 찾을 수 없습니다.',
                availableOpponents: availableManagers.map((manager) => ({
                    managerId: manager.managerId,
                    nickname: manager.nickname,
                    rating: manager.rating,
                    selectedPlayers: manager.teamMembers.map((tm) => ({
                        name: tm.player.name,
                        power: calculatePlayerPower(tm.player, tm.upgrade),
                    })),
                })),
            });
        }

        // 상대방의 선택된 선수 확인
        const opponentSelectedPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: opponentManager.managerId,
                isSelected: true,
            },
            include: {
                player: true,
            },
        });

        if (opponentSelectedPlayers.length === 0) {
            // isSelected가 true인 선수를 보유한 매니저 목록 조회
            const availableManagers = await prisma.manager.findMany({
                where: {
                    AND: [
                        {
                            teamMembers: {
                                some: {
                                    isSelected: true,
                                },
                            },
                        },
                        {
                            managerId: {
                                not: myManager.managerId, // 자신 제외
                            },
                        },
                    ],
                },
                select: {
                    managerId: true,
                    nickname: true,
                    rating: true,
                    teamMembers: {
                        where: {
                            isSelected: true,
                        },
                        include: {
                            player: true,
                            inventories: {
                                include: {
                                    item: true,
                                },
                            },
                        },
                    },
                },
            });

            return res.status(400).json({
                error: '상대방의 선택된 선수가 없습니다.',
                availableOpponents: availableManagers.map((manager) => ({
                    managerId: manager.managerId,
                    nickname: manager.nickname,
                    rating: manager.rating,
                    selectedPlayers: manager.teamMembers.map((tm) => ({
                        name: tm.player.name,
                        power: calculatePlayerPower(tm.player, tm.upgrade),
                    })),
                })),
            });
        }

        captainGameSession.set(String(myAccountId), {
            startTime: new Date(),
            isGameStarted: true,
            myAccountId: Number(myAccountId),
            opponentManagerId: Number(opponentManagerId),
            selectedPlayers: mySelectedPlayers.map((player) => ({
                playerId: player.playerId,
                power: calculatePlayerPower(player.player, player.upgrade),
                name: player.player.name,
                upgrade: player.upgrade,
            })),
        });

        res.status(201).json({
            data: {
                message: '게임(대장전)이 시작되었습니다.',
                selectedPlayers: mySelectedPlayers.map((player) => ({
                    name: player.player.name,
                    power: calculatePlayerPower(
                        player.player,
                        player.upgrade,
                        player.inventories?.item
                    ),
                })),
                opponent: {
                    nickname: opponentManager.nickname,
                    rating: opponentManager.rating,
                    selectedPlayers: opponentSelectedPlayers.map((player) => ({
                        name: player.player.name,
                        power: calculatePlayerPower(
                            player.player,
                            player.upgrade,
                            player.inventories?.item
                        ),
                    })),
                },
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/** 대장전 게임 결과 API **/
router.get('/captain/result', authM, async (req, res) => {
    try {
        const myAccountId = req.account.accountId;
        const gameSession = captainGameSession.get(String(myAccountId));

        if (!gameSession || !gameSession.isGameStarted) {
            return res.status(400).json({
                error: '진행 중인 게임(대장전)이 없습니다.',
            });
        }

        // 매니저 정보 조회
        const [myManager, opponentManager] = await Promise.all([
            prisma.manager.findUnique({
                where: { accountId: Number(myAccountId) },
            }),
            prisma.manager.findUnique({
                where: { managerId: Number(gameSession.opponentManagerId) },
            }),
        ]);

        if (!myManager || !opponentManager) {
            return res.status(404).json({
                error: '매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 상대방의 선택된 선수 조회
        const opponentPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: opponentManager.managerId,
                isSelected: true,
            },
            include: {
                player: true,
            },
            take: 3,
        });

        if (opponentPlayers.length < 3) {
            return res.status(400).json({
                error: '상대방의 선택된 선수가 부족합니다.',
            });
        }

        const matches = gameSession.selectedPlayers.map((myPlayer, index) => {
            const opponentPlayer = opponentPlayers[index];
            const power = calculatePlayerPower(
                opponentPlayer.player,
                opponentPlayer.upgrade
            );
            return {
                round: index + 1,
                myPlayer: {
                    playerId: myPlayer.playerId,
                    power: myPlayer.power,
                    name: myPlayer.name,
                    upgrade: myPlayer.upgrade,
                },
                opponentPlayer: {
                    playerId: opponentPlayer.player.playerId,
                    power: power,
                    name: opponentPlayer.player.name,
                    upgrade: opponentPlayer.upgrade,
                },
                result:
                    myPlayer.power > power
                        ? '승리'
                        : myPlayer.power === power
                          ? '무승부'
                          : '패배',
            };
        });

        const finalResult =
            matches.filter((m) => m.result === '승리').length >= 2
                ? 1
                : matches.filter((m) => m.result === '패배').length >= 2
                  ? 0
                  : 2;

        // 양쪽 플레이어의 결과 업데이트
        await Promise.all([
            updateGameResult(myManager.managerId, finalResult),
            updateGameResult(
                opponentManager.managerId,
                finalResult === 1 ? 0 : finalResult === 0 ? 1 : 2
            ),
            prisma.manager.update({
                where: { managerId: myManager.managerId },
                data: {
                    rating: {
                        increment:
                            finalResult === 1 ? 1 : finalResult === 0 ? -1 : 0,
                    },
                },
            }),
            prisma.manager.update({
                where: { managerId: opponentManager.managerId },
                data: {
                    rating: {
                        increment:
                            finalResult === 1 ? -1 : finalResult === 0 ? 1 : 0,
                    },
                },
            }),
        ]);

        captainGameSession.delete(String(myAccountId));

        res.status(200).json({
            data: {
                matches,
                finalResult:
                    finalResult === 1
                        ? '승리'
                        : finalResult === 0
                          ? '패배'
                          : '무승부',
                opponent: {
                    nickname: opponentManager.nickname,
                    rating: opponentManager.rating,
                },
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
