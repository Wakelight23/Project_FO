import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import { updateGameResult } from '../logic/gameplay.js';

const router = express.Router();

// 랭킹 조회 API
router.get('/ranking', async (req, res) => {
  try {
    const rankings = await prisma.ranking.findMany({
      take: 10,
      include: {
        manager: {
          select: {
            nickname: true,
            rating: true,
          },
        },
      },
      orderBy: [{ win: 'desc' }],
    });

    if (!rankings.length) {
      return res.status(404).json({ error: '랭킹 정보가 없습니다.' });
    }

    const formattedRankings = rankings
      .sort((a, b) => {
        if (b.win === a.win) {
          return b.manager.rating - a.manager.rating;
        }
        return b.win - a.win;
      })
      .map((ranking, index) => ({
        rank: index + 1,
        nickname: ranking.manager.nickname,
        rating: ranking.manager.rating,
        record: {
          win: ranking.win,
          lose: ranking.lose,
          draw: ranking.draw,
          total: ranking.win + ranking.lose + ranking.draw,
          winRate: Math.round(
            (ranking.win / (ranking.win + ranking.lose + ranking.draw)) * 100
          ),
        },
      }));

    res.status(200).json({ data: formattedRankings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 개인 전적 조회 API
router.get('/record/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    const manager = await prisma.manager.findUnique({
      where: { accountId: Number(accountId) },
    });

    if (!manager) {
      return res.status(404).json({ error: '매니저 정보를 찾을 수 없습니다.' });
    }

    const records = await prisma.record.findMany({
      where: { managerId: manager.managerId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    const ranking = await prisma.ranking.findFirst({
      where: { managerId: manager.managerId },
    });

    res.status(200).json({
      data: {
        nickname: manager.nickname,
        rating: manager.rating,
        record: {
          win: ranking?.win || 0,
          lose: ranking?.lose || 0,
          draw: ranking?.draw || 0,
          total:
            (ranking?.win || 0) + (ranking?.lose || 0) + (ranking?.draw || 0),
          winRate: ranking
            ? Math.round(
                (ranking.win / (ranking.win + ranking.lose + ranking.draw)) *
                  100
              )
            : 0,
        },
        recentGames: records.map((record) => ({
          result:
            record.gameResult === 1
              ? '승리'
              : record.gameResult === 2
              ? '무승부'
              : '패배',
          date: record.createdAt,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
