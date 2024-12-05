import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';
const gachaRouter = express();

//
const price = 1;

// 로그 및 예외 처리 함수
const isLog = false;
const Log = (str) => {
    if (isLog) console.log(str);
};
const Exception = (str) => {
    throw new Error(str);
};

// json 요청 파싱
gachaRouter.use(express.json());

// 모든 뽑기 정보 조회
gachaRouter.get('/gachas', async (req, res) => {
    const items = await prisma.player.findMany({
        select: { name: true, type: true, rarity: true, playerImage: true },
    });
    res.json({ success: true, items: items });
});

// 단일 뽑기 정보 조회
gachaRouter.get('/gacha', async (req, res) => {
    try {
        const { playerId } = req.body;
        const item = await prisma.player.findFirst({
            where: { playerId: playerId },
            select: { name: true, type: true, rarity: true, playerImage: true },
        });
        if (item) {
            res.json({ success: true, item: item });
        } else {
            Log('잘못된 아이템 ID 입니다.');
            res.status(404).json({
                success: false,
                message: '아이템을 찾을 수 없습니다.',
            });
        }
    } catch (error) {
        Exception('아이템 뽑기 단일 정보 조회 에러: ' + error);
    }
});

// 랜덤 아이템을 뽑는 함수
const getRandomItems = async (drawCount, gachaCount) => {
    const items = await prisma.player.findMany();
    const max = Math.max(...items.map((item) => item.rarity));
    const mid = Math.floor(max / 2);
    const isUnfotunateSystem = gachaCount > 100 ? true : false;
    const totalProbability = items.reduce((sum, item) => {
        //악날한 시스템
        if (isUnfotunateSystem)
            if (item.rarity < mid) {
                sum + Math.floor(item.rarity + Math.floor(gachaCount / 10));
            } else {
                sum + Math.floor(item.rarity / 2);
            }
        else {
            sum + item.rarity;
        }
    }, 0);
    const drawnItems = [];

    for (let i = 0; i < drawCount; i++) {
        const randomValue = Math.random() * totalProbability;
        let cumulativeProbability = 0;

        for (const item of items) {
            cumulativeProbability += item.rarity;
            if (randomValue < cumulativeProbability) {
                drawnItems.push(item);
                break;
            }
        }
    }

    return drawnItems;
};

// 뽑기 라우터
gachaRouter.post('/gacha', authM, async (req, res) => {
    const { accountId } = req.account;
    const { drawCount } = req.body;
    const resultPrice = price * drawCount;

    let result; // result 변수를 미리 선언

    try {
        const manager = await prisma.manager.findFirst({
            where: { accountId },
        });

        if (!manager) {
            Log('매니저를 찾을 수 없습니다!!');
            return res.json({ success: false, message: '잘못된 접근입니다.' });
        }

        if (manager.cash < resultPrice) {
            return res.json({ success: false, message: '잔액이 부족합니다.' });
        }

        // 랜덤 아이템 뽑기
        const drawnItems = await getRandomItems(drawCount, manager.gachaCount);
        if (!drawnItems.length) {
            throw new Error('뽑기에 실패했습니다.');
        }

        // 트랜잭션 시작
        result = await prisma.$transaction(async (tx) => {
            // 결제 처리
            const updatedManager = await tx.manager.update({
                where: { managerId: manager.managerId },
                data: {
                    cash: manager.cash - resultPrice,
                    gachaCount: manager.gachaCount + drawCount,
                },
            });
            // 팀원 생성 로직
            const teamMembers = await Promise.all(
                drawnItems.map((item) =>
                    tx.teamMember.create({
                        data: {
                            playerId: item.playerId,
                            managerId: updatedManager.managerId,
                        },
                    })
                )
            );

            return { drawnItems, teamMembers };
        });

        return res.json({
            success: true,
            items: result.drawnItems, // 모든 뽑은 아이템 반환
        });
    } catch (error) {
        Exception('아이템 뽑기 라우터 에러: ' + error);
    }
});

export default gachaRouter;
