import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 각종 유효성 검사는 추후에 작성

/** 선수들의 점수를 계산하는 함수 */
export async function teamPowerCheck(players) {
  return players
    .map((player) => player.playerStat)
    .reduce((acc, curr) => {
      return acc + curr;
    }, 0);
}

/** 계정이 보유하고 있는 전체 선수 목록을 조회하는 API */
router.get('/myPlayer', async (req, res, next) => {
  // TO-DO : 토큰 인증 미들웨어 추가

  const { managerId } = req.body;

  try {
    await prisma.$transaction(
      async (tx) => {
        // 계정이 보유하고 있는 선수들의 id를 조회(각 요소가 객체 상태)
        const playersInTeam = await tx.teamtest.findMany({
          where: {
            managerId: +managerId,
          },
          select: {
            playerId: true,
          },
        });

        // 요소의 밸류만 모아서 id들의 배열로 만든다.
        const playerIds = playersInTeam.map((player) => player.playerId);

        const myPlayerList = await tx.playertest.findMany({
          where: {
            playerId: {
              in: playerIds,
            },
          },
          select: {
            playerName: true,
            playerStat: true,
          },
        });

        return res.status(200).json(myPlayerList);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
  } catch (err) {
    next(err);
  }
});

/** 선수 목록에서 경기 출전 선수를 선택하는 API */
router.patch('/rosterIn', async (req, res, next) => {
  const { playerId1, playerId2, playerId3 } = req.body;
  // const { playerId1, playerId2, playerId3 } = [1, 2, 3];
  // const { userEmail } = req.locals;

  // 트랜젝션 내부에선 형변환이 제대로 되지 않는 경우가 있어서 미리 해준다.
  const playerIdNumbers = [playerId1, playerId2, playerId3].map(Number);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        // 선택한 선수의 isSelected 밸류를 true로 변경(게임이 끝나면 false로 바꿔주기)
        await tx.teamtest.updateMany({
          where: {
            // userEmail: +userEmail,
            playerId: {
              in: playerIdNumbers,
            },
          },
          data: {
            isSelected: true,
          },
        });
        // TO-DO : 트랜젝션 넣기
        const players = await tx.playertest.findMany({
          where: {
            // userEmail: +userEmail,
            playerId: {
              in: playerIdNumbers,
            },
          },
          select: {
            playerName: true,
            playerStat: true,
          },
        });

        return players;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );

    // 예상 점수
    const teamPower = await teamPowerCheck(result);

    return res.status(201).json({ players: result, teamPower });
  } catch (err) {
    next(err); // 에러를 다음 미들웨어로 전달
  }
});

export default router;
