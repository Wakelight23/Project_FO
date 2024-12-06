import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';

const router = express.Router();

<<<<<<< HEAD
<<<<<<< HEAD
router.delete('/delete/:managerId', authM, async (req, res) => {
    const { accountId } = req.account;

    // 삭제할 캐릭터의 ID 값을 가져옵니다.
    const managerId = parseInt(req.params.managerId, 10);

    // 삭제하려는 '캐릭터'을 가져옵니다. 없다면 에러를 발생시킵니다.
    const manager = await prisma.manager.findUnique({
        where: { managerId: managerId },
=======
=======
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb
router.delete('/delete/:managerid', authM, async (req, res) => {
    const { accountid } = req.account;

    // 삭제할 캐릭터의 ID 값을 가져옵니다.
    const managerid = parseInt(req.params.managerid, 10);

    // 삭제하려는 '캐릭터'을 가져옵니다. 없다면 에러를 발생시킵니다.
    const manager = await prisma.manager.findUnique({
        where: { managerid: managerid },
<<<<<<< HEAD
>>>>>>> 97df264409276b681807935068d3e9d30674e944
=======
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb
    });

    if (!manager) {
        return res
            .status(404)
            .json({ errorMessage: '존재하지 않는 manager 데이터입니다.' });
    }

    // 조회된 캐릭터를 삭제합니다.
<<<<<<< HEAD
<<<<<<< HEAD
    // 매니저.accountId가 인증을 통해 현재 로그인한 사용자의 account.id와 같은지 판단
    if (manager.accountId === accountId) {
        await prisma.manager.delete({ where: { managerId } });
=======
    // 매니저.accountid가 인증을 통해 현재 로그인한 사용자의 account.id와 같은지 판단
    if (manager.accountid === accountid) {
        await prisma.manager.delete({ where: { managerid } });
>>>>>>> 97df264409276b681807935068d3e9d30674e944
=======
    // 매니저.accountid가 인증을 통해 현재 로그인한 사용자의 account.id와 같은지 판단
    if (manager.accountid === accountid) {
        await prisma.manager.delete({ where: { managerid } });
>>>>>>> ae9af60905f8ee1fe103c96701ebd2f0ed8c7ddb

        return res.status(200).json({ message: '매니저가 삭제되었습니다.' });
    } else {
        return res
            .status(403)
            .json({ errorMessage: '본인 소유의 매니저만 삭제할 수 있습니다.' });
    }
});

export default router;
