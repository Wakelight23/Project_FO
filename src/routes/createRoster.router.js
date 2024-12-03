import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

/** 선수들의 점수를 합산하는 함수(TO-DO: 로직 보강) */
const teamPowerCheck = (players) =>
  players
    .map((player) => player.playerStat) // 배열의 각 요소(선수 데이터)가 객체 상태이기 때문에 playerStat의 밸류만 남겨서 새로운 배열로 반환
    .reduce((acc, curr) => {
      return acc + curr; // playerStat의 총합 계산하기
    }, 0);

/** Number 형식 유효성 검사 함수(1이상의 정수를 받아야 할 때 사용) */
const isValidInput = (input) => /^[0-9]+$/.test(+input) && Number(+input) >= 1;

/** playerId 추출 함수 */

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
        const membersInTeam = await tx.teamtest.findMany({
          where: {
            managerId: +managerId,
          },
          select: {
            teamMemberId: true,
            playerId: true,
          },
        });
        // membersInTeam의 밸류에서 playerId값만 모아서 배열로 만든다.
        const playerIds = membersInTeam.map((member) => member.playerId);

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
  const { teamMemberId1, teamMemberId2, teamMemberId3 } = req.body;
  // const { userEmail } = req.locals;
  // TO-DO : 토큰 인증 미들웨어 추가

  // 트랜젝션 내부에선 형변환이 제대로 되지 않는 경우가 있어서 미리 해준다.
  const teamMemberIds = [teamMemberId1, teamMemberId2, teamMemberId3].map(
    Number
  );

  // (1) 유효성 검사(1 이상의 정수인가?)
  const isValidteamMemberId = teamMemberIds.every(isValidInput);

  // (2) 예외 처리
  if (!teamMemberId1 || !teamMemberId2 || !teamMemberId3) {
    return res.status(400).json({
      error: '세 개의 teamMemberId를 모두 입력해주세요.',
    });
  }
  if (!isValidteamMemberId) {
    return res.status(400).json({
      error: 'teamMemberId는 1이상의 정수여야 합니다.',
    });
  }

  try {
    // id가 없는 선수를 선발했을 때(id에 1억을 입력한다거나...) 예외 처리
    const isValidPlayer = await prisma.teamtest.findMany({
      where: {
        teamMemberId: {
          in: teamMemberIds,
        },
      },
    });
    if (isValidPlayer.length !== 3) {
      return res.status(401).json({ error: '잘못된 요청입니다.' });
    }

    // 선수들의 데이터를 배열로 가져오기
    const result = await prisma.$transaction(
      async (tx) => {
        // 혹시! isSelected가 true인 선수가 이미 있다면 모두 false로 바꿔주기
        await tx.teamtest.updateMany({
          where: {
            isSelected: true,
          },
          data: {
            isSelected: false,
          },
        });

        // 선택한 선수의 isSelected 밸류를 true로 변경(게임이 끝나면 false로 바꿔주기)
        await tx.teamtest.updateMany({
          where: {
            // userEmail: +userEmail,
            teamMemberId: {
              in: teamMemberIds,
            },
          },
          data: {
            isSelected: true,
          },
        });

        // 선발된 선수의 playerId 조회하기
        const membersInRoster = await tx.teamtest.findMany({
          where: {
            teamMemberId: {
              in: teamMemberIds,
            },
          },
          select: {
            teamMemberId: true,
            playerId: true,
          },
        });
        // membersInRoster의 밸류에서 playerId값만 모아서 배열로 만든다.
        const playerIds = membersInRoster.map((member) => member.playerId);

        const players = await tx.playertest.findMany({
          where: {
            // userEmail: +userEmail,
            playerId: {
              in: playerIds,
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

/** 선발 선수를 다른 선수로 변경하는 API */
router.patch('/rosterOut', async (req, res, next) => {
  // TO-DO: 토큰 인증
  // 교체할 선수 둘을 request body를 통해 요청받는다.
  const { outMemberId, inMemberId } = req.body;
  const memberIds = [outMemberId, inMemberId].map(Number);
  try {
    // 유효성 검사 (teamtest 테이블에서 조회했을 때 outPlayerId를 조회했을 때 isSelected가 true인가?)
    await prisma.$transaction(
      async (tx) => {
        await tx.teamtest.updateMany({
          where: {
            teamMemberId: memberIds[0],
          },
          data: {
            isSelected: false,
          },
        });
        await tx.teamtest.updateMany({
          where: {
            teamMemberId: memberIds[1],
          },
          data: {
            isSelected: true,
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );

    // 바뀐 선발 선수 명단을 반환
    const membersInRoster = await prisma.teamtest.findMany({
      where: {
        isSelected: true,
      },
      select: {
        teamMemberId: true,
        playerId: true,
      },
    });
    // membersInRoster의 밸류에서 playerId값만 모아서 배열로 만든다.
    const playerIds = membersInRoster.map((member) => member.playerId);

    const players = await prisma.playertest.findMany({
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
    // 예상 점수
    const teamPower = await teamPowerCheck(players);

    return res.status(201).json({ players, teamPower });
  } catch (err) {
    next(err);
  }
});

export default router;
