import express from 'express';
import { prisma } from '../utils/prisma/index.js';

const router = express.Router();

// 전체 매니저 조회 (조회 기준 rating?)
router.get('/search', async (req, res, next) => {
  const manager = await prisma.manager.findMany({
    select: {
      nickname: true,
      rating: true,
      cash: true,
    },
    orderBy: {
      rating: 'desc',
    },
  });

  return res.status(200).json({ data: manager });
});

// 팀 상세조회
router.get('/search/:managerid', async (req, res, next) => {
  // req.params에서 managerid 추출
  const { managerid } = req.params;

  // 특정 조건에 맞는 매니저의 정보는 detailInfo
  const detailInfo = await prisma.manager.findFirst({
    // 그 조건은 manager 테이블의 managerid 컬럼에
    // 요청된 managerid 있는지 확인
    // +managerid의 +는 문자열을 숫자로 변환하는 방법중 하나
    // managerid는 파라미터로 전달되는데, 이때 문자열로 전달된다.
    // managerid는 숫자형태이기 때문에 변환과정 필요
    where: {
      managerid: +managerid,
    },
    // 반환할 컬럼 지정 선발 명단, 레이팅, 전적 등?
    select: {},
  });

  return res.status(200).json({ data: detailInfo });
});

export default router;
