import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import {
    calculateTeamPower,
    generateOpponentPower,
    determineWinner,
    updateGameResult,
} from '../../logic/gameplay.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// 게임 진행 상태를 저장할 Map = 게임 세션(게임 룸? 게임 방?)
const gameSessionMap = new Map();

/** 일반 게임 시작 API **/
router.post('/choicematch/start', authM, async (req, res) => {
    try {
        const myAccountId = req.account.accountId;
        const { opponentManagerId } = req.body;

        if (!opponentManagerId) {
            return res.status(400).json({
                error: '상대방 매니저 ID가 필요합니다.',
            });
        }

        // 내 계정 확인
        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(myAccountId) },
        });

        if (!myManager) {
            return res.status(404).json({
                error: '매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 자신과의 대결 체크
        if (myManager.managerId === Number(opponentManagerId)) {
            return res.status(400).json({
                error: '자신과는 대결할 수 없습니다.',
            });
        }

        // 상대방 매니저 확인
        const opponentManager = await prisma.manager.findUnique({
            where: { managerId: Number(opponentManagerId) },
        });

        if (!opponentManager) {
            // isSelected가 true인 매니저 목록 조회
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
                },
            });

            return res.status(404).json({
                error: '상대방 매니저를 찾을 수 없습니다.',
                availableOpponents: availableManagers,
            });
        }

        // 선수 정보 조회
        const [mySelectedPlayers, opponentSelectedPlayers] = await Promise.all([
            prisma.teamMember.findMany({
                where: {
                    managerId: myManager.managerId,
                    isSelected: true,
                },
            }),
            prisma.teamMember.findMany({
                where: {
                    managerId: opponentManager.managerId,
                    isSelected: true,
                },
            }),
        ]);

        if (mySelectedPlayers.length === 0) {
            return res.status(400).json({
                error: '선택된 선수가 없습니다. 선수를 먼저 선택해주세요.',
            });
        }

        if (opponentSelectedPlayers.length === 0) {
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
                },
            });

            return res.status(400).json({
                error: '상대방의 선택된 선수가 없습니다.',
                availableOpponents: availableManagers,
            });
        }

        // 게임 세션 생성
        gameSessionMap.set(String(myAccountId), {
            startTime: new Date(),
            isGameStarted: true,
            opponentManagerId: Number(opponentManagerId),
        });

        res.status(201).json({
            data: {
                message: '게임이 시작되었습니다.',
                opponent: {
                    nickname: opponentManager.nickname,
                    rating: opponentManager.rating,
                },
            },
        });
    } catch (error) {
        console.error('Game start error:', error);
        res.status(500).json({ error: error.message });
    }
});

/** 일반 게임 결과 API **/
router.get('/choicematch/result', authM, async (req, res) => {
    try {
        const accountId = req.account.accountId;

        // 게임 세션 확인
        const gameSession = gameSessionMap.get(String(accountId));

        if (!gameSession || !gameSession.isGameStarted) {
            return res.status(400).json({
                error: '진행되고 있는 게임이 존재하지 않습니다',
            });
        }

        // 내 매니저 정보 조회
        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(accountId) },
        });

        if (!myManager) {
            return res.status(404).json({
                error: '매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 내 선수들 정보 조회
        const selectedPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: myManager.managerId,
                isSelected: true,
            },
            include: {
                player: true,
            },
        });

        // 상대방 매니저 정보 조회
        const opponentManager = await prisma.manager.findUnique({
            where: { managerId: Number(gameSession.opponentManagerId) },
        });

        if (!opponentManager) {
            return res.status(404).json({
                error: '상대방 매니저 정보를 찾을 수 없습니다.',
            });
        }

        const totalPower = calculateTeamPower(selectedPlayers);
        const opponentPower = generateOpponentPower(totalPower);
        const gameResult = determineWinner(totalPower, opponentPower);

        // 양쪽 플레이어의 결과 업데이트
        await Promise.all([
            updateGameResult(myManager.managerId, gameResult.result),
            updateGameResult(
                opponentManager.managerId,
                gameResult.result === 1 ? 0 : gameResult.result === 0 ? 1 : 2
            ),
        ]);

        res.status(202).json({
            data: {
                totalPower: `나의 팀 전투력 : ${Math.floor(totalPower)}`,
                opponentPower: `상대 팀 전투력 : ${Math.floor(opponentPower)}`,
                randomResult: `${gameResult.details.randomFactor}(=랜덤 수치) : ${gameResult.details.winProbability}(=내 전투력에 기반한 승률)`,
                gameResult: `${
                    gameResult.result === 1
                        ? '승리'
                        : gameResult.result === 2
                          ? '무승부'
                          : '패배'
                } 입니다`,
                opponent: {
                    nickname: opponentManager.nickname,
                    rating: opponentManager.rating,
                },
            },
        });

        // 게임 결과 처리 후 세션 삭제
        gameSessionMap.delete(String(accountId));
    } catch (error) {
        console.error('Game result error:', error);
        res.status(500).json({ error: error.message });
    }
});

// 선택된 선수들 정보 조회
router.get('/selectplayer', authM, async (req, res) => {
    try {
        const accountId = req.account.accountId;

        // 해당 account의 manager 찾기
        const manager = await prisma.manager.findUnique({
            where: { accountId: parseInt(accountId) },
        });

        if (!manager) {
            return res
                .status(404)
                .json({ message: '해당 감독을 찾을 수 없습니다.' });
        }

        // 선택된 선수들 조회
        const selectedPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: manager.managerId,
                isSelected: true,
            },
            include: {
                player: true, // player 정보 포함
            },
        });

        // 전투력 계산
        const totalPower = calculateTeamPower(selectedPlayers);

        // 상대방 전투력 생성 (현재 전투력의 80~120% 범위)
        const opponentPower = generateOpponentPower(totalPower);

        // 승패 결정
        const gameResult = determineWinner(totalPower, opponentPower);

        // 게임 결과 저장
        await prisma.record.create({
            data: {
                managerId: manager.managerId,
                gameResult: gameResult.result, // 1: 승리, 0: 패배
            },
        });

        res.json({
            myTeam: {
                players: selectedPlayers,
                power: totalPower,
            },
            opponent: {
                power: opponentPower,
            },
            result: gameResult,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
