import express from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 같은 등급의 카드가 있으면 확률에 따라 강화가 된다.
// 강화가 실패하면 임의의 등급으로 하락한다.
// 인증 미들웨어 추가

/** 멤버 업그레이드 API */
router.patch('/upgrade/:teamMemberId', async (req, res, next) => {
  const { managerId, memberIdToUpgrade, memberIdToSacrifice } = req.body;

  const Ids = [managerId, memberIdToUpgrade, memberIdToSacrifice].map(Number);

  // 유효성 검사(1 이상의 정수인가? 빈 값이 들어오진 않았는가? 데이터 형식이 다르지는 않은가?)
  const isValidIds = isValidInput(Ids);
  if (!!managerId) {
    return res.status(400).json({
      error: '로그인 계정을 찾을 수 없습니다.',
    });
  }
  if (!memberIdToUpgrade || !memberIdToSacrifice) {
    return res.status(400).json({
      error:
        '등급을 강화할 멤버와 강화 재료로 쓰일 멤버의 id를 모두 입력해 주세요.',
    });
  }
  if (!isValidIds) {
    return res.status(400).json({
      error: '잘못된 계정을 통한 접근입니다.',
    });
  }

  // 예외 처리(둘이 같은 playerId를 가지고 있는지, 등급이 같은지, 둘 다 계정의 소유가 맞는지)
});

export default router;
