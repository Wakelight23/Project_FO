import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import authM from '../../middlewares/auth.js';
const gachaRouter = express();

const isLog = false;

const Log = (str) => {
    if (isLog) console.log(str);
};

// json 요청 파싱
gachaRouter.use(express.json()); // 메인으로 이동해야함

//라우터
//#region 모든뽑기정보
//모든 뽑기 정보 조회
gachaRouter.get('/gachas', async (req, res) => {
    const items = await prisma.player.findMany({
        select: { name: true, type: true, rarity: true, playerImage: true },
    });
    res.json({
        success: true,
        items: items,
    });
});
//#endregion

//#region 단일 뽑기 정보
//단일 뽑기 정보 조회
gachaRouter.get('/gacha', async (req, res) => {
    try {
        const { playerId } = req.body;
        const item = await prisma.player.findFirst({
            where: { playerId: playerId },
            select: { name: true, type: true, rarity: true, playerImage: true },
        });
        if (item) {
            res.json({
                success: true,
                item: item,
            });
        } else {
            Log('잘못된 아이템 ID 입니다.');
            res.status(404).json({
                success: false,
                message: '아이템을 찾을 수 없습니다.',
            });
        }
    } catch (error) {
        throw new Error(
            '아이템 뽑기 단일 정보 조회 에러 팀원 김정태를 찌르세요.'
        );
    }
});
//#endregion

//auth 적용해야함 -->authM

//#region 뽑기

// 랜덤 아이템을 뽑는 함수
const getRandomItems = async (drawCount) => {
    try {
        Log('뽑기 시작');
        const items = await prisma.player.findMany();
        Log('뽑기 플레이어 가져옴' + drawCount);
        //Log(items);

        const totalProbability = items.reduce(
            (sum, item) => sum + item.rarity,
            0
        );
        Log('뽑기의 가중치 모두 계산' + totalProbability);

        const drawnItems = [];

        for (let i = 0; i < drawCount; i++) {
            const randomValue = Math.random() * totalProbability;
            Log('뽑을 랜덤값 지정 완료 : ' + i);
            let cumulativeProbability = 0;
            Log('랜덤값 판정 유닛 검색중 : ' + i);

            for (const item of items) {
                cumulativeProbability += item.rarity;
                if (randomValue < cumulativeProbability) {
                    drawnItems.push(item); // 뽑은 아이템을 배열에 추가
                    break; // 아이템을 뽑으면 루프를 탈출
                }
            }
        }

        return drawnItems; // 뽑은 아이템 배열 반환
    } catch (error) {
        throw new Error('뽑기 함수 에러 팀원 김정태를 찌르세요!!');
    }
};

//#endregion

//#region 뽑기 라우터
// 뽑기
gachaRouter.post('/gacha', authM, async (req, res) => {
    try {
        Log('Test');
        const { accountId } = req.account;
        Log(accountId);
        const { drawCount } = req.body;
        Log(drawCount);

        const manager = await prisma.manager.findFirst({
            where: { accountId },
        });

        if (!manager) {
            throw new Error(
                '매니저가 없습니다! 이것은 저를 찔러도 뭐 안나옵니다!!!'
            );
        }

        const drawnItems = await getRandomItems(drawCount); // 여러 아이템을 뽑기 위한 호출
        if (!drawnItems.length) {
            return res.json({
                success: false,
                message: '500 고객센터에 항의하세요!',
            });
        }

        // 팀원 생성 로직
        const teamMembers = await Promise.all(
            drawnItems.map((item) =>
                prisma.teamMember.create({
                    data: {
                        playerId: item.playerId,
                        managerId: manager.managerId,
                    },
                })
            )
        );

        return res.json({
            success: true,
            items: drawnItems, // 모든 뽑은 아이템 반환
        });
    } catch (error) {
        throw new Error(
            '아이템 뽑기 라우터 에러 팀원 김정태를 찌르세요.' + error
        );
    }
});
//#endregion

export default gachaRouter;
