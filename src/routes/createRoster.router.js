import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 각종 유효성 검사는 추후에 작성

/** 계정이 보유하고 있는 전체 선수 목록을 조회하는 API */
router.get('/roster', async (req, res, next) => {
  // TO-DO : 토큰 인증 미들웨어 추가

  const { userEmail } = req.locals;

  try {
    const myPlayerList = await prisma.player.findMany({
      where: {
        userEmail: +userEmail,
      },
      select: {
        playerId: true,
        playerName: true,
      },
    });
    return res.status(200).json(myPlayerList);
  } catch (err) {
    next(err);
  }
});

/** 선수 목록에서 경기 출전 선수를 선택하는 API */
router.patch('/roster', async (req, res, next) => {
  const { playerId1, playerId2, playerId3 } = req.body;
  const { userEmail } = req.locals;

  try {
    // 선택한 선수의 isSelected 밸류를 true로 변경(게임이 끝나면 false로 바꿔주기)
    await prisma.player.update({
      where: {
        userEmail: +userEmail,
        playerId: {
          in: [+playerId1, +playerId2, +playerId3],
        },
      },
      data: {
        isSelected: true,
      },
    });
    // TO-DO : 트랜젝션 넣기
    const players = await prisma.player.findMany({
      where: {
        userEmail: +userEmail,
        playerId: {
          in: [+playerId1, +playerId2, +playerId3],
        },
      },
      select: {
        playerId: true,
        playerName: true,
      },
    });

    return res.status(201).json(players);
  } catch (err) {
    next(err); // 에러를 다음 미들웨어로 전달
  }
});

export default router;
