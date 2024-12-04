import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';
import { isValidInput } from './createRoster.router.js';

const router = express.Router();

/** 계정이 보유하고 있는 선수 목록을 조회하는 API */
router.get('/myTeamMember', async (req, res, next) => {
  // TO-DO : 토큰 인증 미들웨어 추가
  const { managerId } = req.header; // 이 부분을 토큰으로 받을 수 있을 것 같다.

  try {
    // 유효성 검사(1 이상의 정수인가? 빈 값이 들어오진 않았는가? 데이터 형식이 다르지는 않은가?)
    // const isValidManagerId = isValidInput(managerId);
    // if (!managerId) {
    //   return res.status(400).json({
    //     error: '로그인 계정을 찾을 수 없습니다.',
    //   });
    // }
    // if (!isValidManagerId) {
    //   return res.status(400).json({
    //     error: '잘못된 계정을 통한 접근입니다.',
    //   });
    // }

    // 예외처리(존재하지 않는 managerId인 경우)
    const isExitManagerId = await prisma.manager.findFirst({
      where: {
        managerId: +managerId,
      },
    });

    if (!isExitManagerId) {
      return res.status(400).json({
        error: '존재하지 않는 managerId입니다.',
      });
    }
    // 선수 목록 조회
    await prisma.$transaction(
      async (tx) => {
        // 계정이 보유하고 있는 선수들의 id를 조회(이 배열의 요소는 객체 상태)
        const membersInTeam = await tx.teamMember.findMany({
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
        const myPlayerList = await tx.player.findMany({
          where: {
            playerId: {
              in: playerIds,
            },
          },
          select: {
            name: true,
            club: true,
            speed: true,
            goalFinishing: true,
            shootPower: true,
            defense: true,
            stamina: true,
            rarity: true,
            type: true,
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

// TO-DO: rarity, grade(upgrade 횟수), 스탯별 정렬 API

export default router;
