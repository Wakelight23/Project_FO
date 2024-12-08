import { prisma } from '../utils/prisma/index.js';

//두 값 사이의 난수 생성
function getRandomInt(min, max) {
    const minCeiled = Math.ceil(min);
    const maxFloored = Math.floor(max);
    return Math.floor(Math.random() * (maxFloored - minCeiled) + minCeiled); // 최댓값은 제외, 최솟값은 포함
}
//어드민 체크
// 어드민이면 true
async function checkAdmin(accountId) {
    const isAdmin = await prisma.account.findFirst({
        select: {
            accountId: true,
            isAdmin: true,
        },
        where: {
            accountId: +accountId,
        },
    });
    if (!isAdmin || isAdmin.isAdmin === false) {
        return false;
        //res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
    }
    return true;
}

export default {
    getRandomInt,
    checkAdmin,
};
