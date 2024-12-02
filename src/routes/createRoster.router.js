import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/** 선수들의 점수를 합산하는 함수(TO-DO: 로직 보강) */
export async function teamPowerCheck(players) {
  return players
    .map((player) => player.playerStat)
    .reduce((acc, curr) => {
      return acc + curr;
    }, 0);
}

/** Number 형식 유효성 검사 함수(1이상의 정수를 받아야 할 때 사용) */
const isValidInput = (input) => /^[0-9]+$/.test(+input) && Number(+input) >= 1;

/** 계정이 보유하고 있는 전체 선수 목록을 조회하는 API */
router.get('/myPlayer', async (req, res, next) => {
  // TO-DO : 토큰 인증 미들웨어 추가
  const { managerId } = req.body; // 이 부분을 토큰으로 받을 수 있을 것 같다.

  try {
    // (1) 유효성 검사(1 이상의 정수인가?)
    const isValidManagerId = isValidInput(managerId);
    // (2) 예외 처리
    if (!managerId) {
      return res.status(400).json({
        error: 'managerId를 입력해 주세요.',
      });
    }
    if (!isValidManagerId) {
      return res.status(400).json({
        error: 'managerId는 1이상의 정수여야 합니다.',
      });
    }

    // 선수 목록 조회
    await prisma.$transaction(
      async (tx) => {
        // 계정이 보유하고 있는 선수들의 id를 조회(이 배열의 요소는 객체 상태)
        const playersInTeam = await tx.teamtest.findMany({
          where: {
            managerId: +managerId,
          },
          select: {
            playerId: true,
          },
        });

        // playersInTeam의 밸류에서 playerId값만 모아서 배열로 만든다.
        const playerIds = playersInTeam.map((player) => player.playerId);

        // playerIds 배열을 where의 조건으로 설정한 뒤 선수 테이블을 조회. 이름이랑 스탯을 가져온다.
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

/** 출전 선수를 선발하는 API */
router.patch('/rosterIn', async (req, res, next) => {
  const { playerId1, playerId2, playerId3 } = req.body;
  // const { userEmail } = req.locals;
  // TO-DO : 토큰 인증 미들웨어 추가

  const playerIds = [playerId1, playerId2, playerId3];

  // (1) 유효성 검사(1 이상의 정수인가?)
  const isValidPlayerId = playerIds.every(isValidInput);

  // (2) 예외 처리
  if (!playerId1 || !playerId2 || !playerId3) {
    return res.status(400).json({
      error: '세 개의 playerId를 모두 입력해주세요.',
    });
  }
  if (!isValidPlayerId) {
    return res.status(400).json({
      error: 'playerId는 1이상의 정수여야 합니다.',
    });
  }

  // 트랜젝션 내부에선 형변환이 제대로 되지 않는 경우가 있어서 미리 해준다.
  const playerIdNumbers = playerIds.map(Number);

  try {
    // id가 없는 선수를 선발했을 때(id에 1억을 입력한다거나...) 예외 처리
    const isValidPlayer = await prisma.teamtest.findMany({
      where: {
        playerId: {
          in: playerIdNumbers,
        },
      },
    });
    if (isValidPlayer.length !== 3) {
      return res.status(401).json({ error: '잘못된 요청입니다.' });
    }

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

// TO-DO : rosterOut

export default router;
