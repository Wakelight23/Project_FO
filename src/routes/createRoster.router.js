import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 각종 유효성 검사는 추후에 작성

/** 계정이 보유하고 있는 전체 선수 목록을 조회하는 API */
router.get('/myPlayer', async (req, res, next) => {
  // TO-DO : 토큰 인증 미들웨어 추가

  // const { userEmail } = req.locals;

  try {
    const myPlayerList = await prisma.playertest.findMany({
      // where: {
      //   userEmail: +userEmail,
      // },
      select: {
        playerName: true,
        playerStat: true,
      },
    });
    return res.status(200).json(myPlayerList);
  } catch (err) {
    next(err);
  }
});

/** 선수 목록에서 경기 출전 선수를 선택하는 API */
router.patch('/rosterIn', async (req, res, next) => {
  // const { playerId1, playerId2, playerId3 } = req.body;
  const { playerId1, playerId2, playerId3 } = [1, 2, 3];
  // const { userEmail } = req.locals;

  // 트랜젝션 내부에선 형변환이 제대로 되지 않는 경우가 있어서 미리 해준다.
  const [playerId1Number, playerId2Number, playerId3Number] = [
    +playerId1,
    +playerId2,
    +playerId3,
  ];

  try {
    // 선택한 선수의 isSelected 밸류를 true로 변경(게임이 끝나면 false로 바꿔주기)
    await prisma.playertest.update({
      where: {
        // userEmail: +userEmail,
        playerId: {
          in: [playerId1Number, playerId2Number, playerId3Number],
        },
      },
      data: {
        isSelected: true,
      },
    });
    // TO-DO : 트랜젝션 넣기
    const players = await prisma.playertest.findMany({
      where: {
        // userEmail: +userEmail,
        playerId: {
          in: [playerId1Number, playerId2Number, playerId3Number],
        },
      },
      select: {
        playerName: true,
        playerStat: true,
      },
    });

    // 예상 점수
    const teamPower = teamScore(players).reduce((acc, curr) => {
      return acc + curr;
    }, 0);

    return res.status(201).json(players, teamPower);
  } catch (err) {
    next(err); // 에러를 다음 미들웨어로 전달
  }
});

/** 선수들의 점수를 계산하는 함수 */
export async function teamPower(players) {
  // 계산 계산 계산

  let teamPower = [100, 90, 80];

  return teamPower;
}

export default router;
