import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import {
    calculatePlayerPower,
    updateGameResult,
} from '../../logic/gameplay.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

// 랭크 매치 게임 세션 저장
const rankMatchSessions = new Map();

// 1. 랭크 매치 시작 API
router.get('/rankmatch/start', authM, async (req, res) => {
    try {
        const accountId = req.account.accountId;

        const myManager = await prisma.manager.findUnique({
            where: { accountId: Number(accountId) },
            include: {
                teamMembers: {
                    where: { isSelected: true },
                    include: {
                        player: true,
                        inventories: { include: { item: true } },
                    },
                },
            },
        });

        if (!myManager || myManager.teamMembers.length !== 3) {
            return res
                .status(400)
                .json({ error: '선택된 선수가 3명이 아닙니다.' });
        }

        // 레이팅 범위 설정
        const minRating = myManager.rating - 20;
        const maxRating = myManager.rating + 20;

        // 매칭 가능한 상대 찾기
        const opponents = await prisma.manager.findMany({
            where: {
                rating: { gte: minRating, lte: maxRating },
                managerId: { not: myManager.managerId },
                teamMembers: { some: { isSelected: true } },
            },
            include: {
                teamMembers: {
                    where: { isSelected: true },
                    include: {
                        player: true,
                        inventories: { include: { item: true } },
                    },
                },
            },
        });

        if (opponents.length === 0) {
            return res
                .status(404)
                .json({ error: '매칭 가능한 상대가 없습니다.' });
        }

        // 랜덤 매칭
        const opponent =
            opponents[Math.floor(Math.random() * opponents.length)];

        // 게임 세션 생성
        const gameSession = {
            myManagerId: myManager.managerId,
            opponentManagerId: opponent.managerId,
            myPlayers: myManager.teamMembers.map((tm) => ({
                ...tm.player,
                power: calculatePlayerPower(
                    tm.player,
                    tm.upgrade,
                    tm.inventories[0]?.item
                ),
            })),
            opponentPlayers: opponent.teamMembers.map((tm) => ({
                ...tm.player,
                power: calculatePlayerPower(
                    tm.player,
                    tm.upgrade,
                    tm.inventories[0]?.item
                ),
            })),
            status: 'ready',
        };

        rankMatchSessions.set(String(accountId), gameSession);

        res.status(200).json({
            message: '랭크 매치가 시작되었습니다.',
            opponent: {
                nickname: opponent.nickname,
                rating: opponent.rating,
            },
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. 랭크 매치 진행 API
router.get('/rankmatch/playing', authM, async (req, res) => {
    try {
        const { accountId } = req.account;
        const gameSession = rankMatchSessions.get(String(accountId));

        if (!gameSession || gameSession.status !== 'ready') {
            return res
                .status(400)
                .json({ error: '진행 중인 랭크 매치가 없습니다.' });
        }

        const { myPlayers, opponentPlayers } = gameSession;
        let myScore = 0;
        let opponentScore = 0;
        const matchLog = [];

        const playRound = () => {
            const allPlayers = [...myPlayers, ...opponentPlayers].sort(
                (a, b) => b.power - a.power
            );
            for (const player of allPlayers) {
                const goalProbability = player.power / 1000; // 예: 전투력 500이면 50% 확률
                if (Math.random() < goalProbability) {
                    if (myPlayers.includes(player)) {
                        myScore++;
                    } else {
                        opponentScore++;
                    }
                    matchLog.push(`${player.name}이(가) 골을 넣었습니다!`);
                    if (myScore !== opponentScore) {
                        return;
                    }
                }
            }
        };

        while (myScore === opponentScore) {
            playRound();
        }

        gameSession.status = 'completed';
        gameSession.result = { myScore, opponentScore, matchLog };

        res.status(200).json({
            myScore,
            opponentScore,
            matchLog,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. 랭크 매치 결과 API
router.get('/rankmatch/result', authM, async (req, res) => {
    try {
        const { accountId } = req.account;
        const gameSession = rankMatchSessions.get(String(accountId));

        if (!gameSession || gameSession.status !== 'completed') {
            return res
                .status(400)
                .json({ error: '완료된 랭크 매치가 없습니다.' });
        }

        const { myManagerId, opponentManagerId, result } = gameSession;
        const { myScore, opponentScore } = result;

        const gameResult = myScore > opponentScore ? 1 : 0;

        // 결과 업데이트
        await Promise.all([
            updateGameResult(myManagerId, gameResult),
            updateGameResult(opponentManagerId, gameResult === 1 ? 0 : 1),
        ]);

        // 세션 삭제
        rankMatchSessions.delete(String(accountId));

        res.status(200).json({
            result: gameResult === 1 ? '승리' : '패배',
            score: `${myScore} : ${opponentScore}`,
            matchLog: result.matchLog,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
