import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import authM from '../middlewares/auth.js';

const router = express.Router();

router.delete('/delete/:managerid', authM, async (req, res) => {
  // 삭제할 캐릭터의 ID 값을 가져옵니다.
  const managerid = parseInt(req.params.managerid, 10);
  console.log(managerid);
  // 삭제하려는 '캐릭터'을 가져옵니다. 없다면 에러를 발생시킵니다.
  const manager = await prisma.manager.findUnique({
    where: { managerid: managerid },
  });

  if (!manager) {
    return res
      .status(404)
      .json({ errorMessage: '존재하지 않는 manager 데이터입니다.' });
  }

  // 조회된 캐릭터를 삭제합니다.
  await prisma.manager.delete({ where: { managerid } });

  return res.status(200).json({ message: '매니저가 삭제되었습니다.' });
});

export default router;
