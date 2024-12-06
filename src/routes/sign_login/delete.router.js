import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

router.delete('/delete/:managerId', authM, async (req, res) => {
    const { accountId } = req.account;

    // 삭제할 캐릭터의 ID 값을 가져옵니다.
    const managerId = parseInt(req.params.managerId, 10);

    // 삭제하려는 '캐릭터'을 가져옵니다. 없다면 에러를 발생시킵니다.
    const manager = await prisma.manager.findUnique({
        where: { managerId: managerId },
    });

    if (!manager) {
        return res
            .status(404)
            .json({ errorMessage: '존재하지 않는 manager 데이터입니다.' });
    }

    // 조회된 캐릭터를 삭제합니다.
    // 매니저.accountId가 인증을 통해 현재 로그인한 사용자의 account.id와 같은지 판단
    if (manager.accountId === accountId) {
        await prisma.manager.delete({ where: { managerId } });

        return res.status(200).json({ message: '매니저가 삭제되었습니다.' });
    } else {
        return res
            .status(403)
            .json({ errorMessage: '본인 소유의 매니저만 삭제할 수 있습니다.' });
    }
});

export default router;
