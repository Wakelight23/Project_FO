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
        const { opponentAccountId, selectedPlayerIds } = req.body;

        if (!myAccountId) {
            return res.status(401).json({ error: '인증 정보가 없습니다.' });
        }

        if (!selectedPlayerIds || selectedPlayerIds.length !== 3) {
            return res.status(400).json({
                error: '3명의 선수를 순서대로 선택해야 합니다.',
            });
        }

        if (Number(myAccountId) === Number(opponentAccountId)) {
            return res.status(400).json({
                error: '자신의 계정과는 대결할 수 없습니다.',
            });
        }

        const [myAccount, opponentAccount] = await Promise.all([
            prisma.account.findUnique({
                where: { accountId: Number(myAccountId) },
            }),
            prisma.account.findUnique({
                where: { accountId: Number(opponentAccountId) },
            }),
        ]);

        if (!myAccount || !opponentAccount) {
            return res.status(404).json({ error: '계정을 찾을 수 없습니다.' });
        }

        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(myAccountId) },
        });

        const mySelectedPlayers = await Promise.all(
            selectedPlayerIds.map(async (playerId) => {
                return await prisma.teamMember.findFirst({
                    where: {
                        managerId: myManager.managerId,
                        playerId: Number(playerId),
                        isSelected: true,
                    },
                    include: { player: true },
                });
            })
        );

        if (mySelectedPlayers.some((player) => !player)) {
            const availablePlayers = await prisma.teamMember.findMany({
                where: {
                    managerId: myManager.managerId,
                    isSelected: true,
                },
                include: { player: true },
            });

            return res.status(400).json({
                error: '선택한 선수 중 유효하지 않은 선수가 있습니다.',
                availablePlayers: availablePlayers.map((member) => ({
                    playerId: member.playerId,
                    name: member.player.name,
                    isSelected: member.isSelected,
                })),
            });
        }

        captainGameSession.set(String(myAccountId), {
            startTime: new Date(),
            isGameStarted: true,
            myAccountId: Number(myAccountId),
            opponentAccountId: Number(opponentAccountId),
            selectedPlayers: mySelectedPlayers.map((player) => ({
                playerId: player.playerId,
                power: calculatePlayerPower(player.player),
                name: player.player.name,
            })),
        });

        res.status(201).json({
            data: {
                message: '게임(대장전)이 시작되었습니다.',
                selectedPlayers: mySelectedPlayers.map(
                    (player) => player.player.name
                ),
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

        // 세션 확인
        const gameSession = captainGameSession.get(String(myAccountId));
        if (!gameSession || !gameSession.isGameStarted) {
            return res.status(400).json({
                error: '진행 중인 게임(대장전)이 없습니다.',
            });
        }

        // 내 매니저 정보 조회
        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(myAccountId) },
        });

        if (!myManager) {
            return res.status(404).json({
                error: '내 매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 상대방 매니저 확인
        const opponentManager = await prisma.manager.findUnique({
            where: { accountId: Number(gameSession.opponentAccountId) },
        });

        if (!opponentManager) {
            return res.status(404).json({
                error: '상대방 매니저 정보를 찾을 수 없습니다.',
            });
        }

        // 상대방 선수 조회
        // 상대방의 선택된 선수들 조회
        const opponentPlayers = await prisma.teamMember.findMany({
            where: {
                managerId: opponentManager.managerId,
                isSelected: true,
            },
            include: {
                player: true,
            },
            take: 3, // 3명만 선택
        });

        if (!opponentPlayers || opponentPlayers.length === 0) {
            return res.status(400).json({
                error: '상대방의 선택된 선수가 없습니다.',
            });
        }

        // const randomOpponentPlayer =
        //     opponentPlayers[Math.floor(Math.random() * opponentPlayers.length)];
        // const opponentPlayerPower = calculatePlayerPower(
        //     randomOpponentPlayer.player
        // );

        // 승패 결정 로직 추가
        const gameResult = determineCaptainWinner(
            gameSession.selectedPlayers,
            opponentPlayers.map((player) => ({
                power: calculatePlayerPower(player.player),
                name: player.player.name,
            }))
        );

        // 양쪽 플레이어의 결과 업데이트
        await Promise.all([
            updateGameResult(
                myManager.managerId,
                gameResult.result === 1 ? 0 : gameResult.result === 0 ? 1 : 2
            ),
            updateGameResult(opponentManager.managerId, gameResult.result),
        ]);

        // 세션 삭제
        captainGameSession.delete(String(myAccountId));

        res.status(200).json({
            data: {
                matches: gameResult.details.map((result, index) => ({
                    round: index + 1,
                    myPlayer: gameSession.selectedPlayers[index],
                    opponentPlayer: opponentPlayers[index],
                    result,
                })),
                finalResult: gameResult.result === 1 ? '승리' : '패배',
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
