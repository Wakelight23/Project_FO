// src/routes/items.router.js
import express from 'express';
import multer from 'multer';
import simpleLogic from '../../logic/simpleLogic.js'
import { prisma } from '../../utils/prisma/index.js';
import { isValidInput } from '../teammember/createRoster.router.js';

const router = express.Router();

// model Item {
//     itemId        Int         @id @default(autoincrement())
//     name          String
//     speed         Int
//     goalFinishing Int
//     shootPower    Int
//     defense       Int
//     stamina       Int
//     rarity        Int
//     itemImage     String?
//     createdAt     DateTime    @default(now())
//     updatedAt     DateTime
//     Equipment     Equipment[]
//   }

/** 아이템 목록 조회 API **/
router.get('/items', async (req, res, next) => {
    // id, 이름, 레어도를 조회한다.
    try {
        const itemList = await prisma.item.findMany({
            select: {
                itemId: true,
                name: true,
                rarity: true,
            },
        });
        // 정상적으로 조회시 res
        return res.status(200).json({ ...itemList });
    } catch (err) {
        next(err);
    }
});
// /** 아이템 상세 조회 API **/
router.get('/items/:itemId', async (req, res, next) => {
    // itemId를 파라미터로 받아 상세한 정보를 조회한다.
    // 어드민 여부에 따라 다른 정보가 조회된다.

    try {
        const { itemId } = req.params;
        if (!itemId)
            return res
                .status(400)
                .json({ message: 'itemId가 입력되지 않았습니다.' });
        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }

        let isExistItem;
        if (await simpleLogic.checkAdmin(accountId)) {
            isExistItem = await prisma.item.findFirst({
                select: {
                    itemId: true,
                    name: true,
                    speed: true,
                    goalFinishing: true,
                    shootPower: true,
                    defense: true,
                    stamina: true,
                    rarity: true,
                    createdAt: true,
                    updatedAt: true,
                },
                where: {
                    itemId: +itemId,
                },
            });
        } else {
            isExistItem = await prisma.item.findFirst({
                select: {
                    name: true,
                    speed: true,
                    goalFinishing: true,
                    shootPower: true,
                    defense: true,
                    stamina: true,
                    rarity: true,
                },
                where: {
                    itemId: +itemId,
                },
            });
        }

        if (!isExistItem) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 아이템입니다.' });
        }
        return res.status(200).json(isExistItem);
    } catch (err) {
        next(err);
    }
});
// /** 새로운 아이템 생성 API **/
router.post('/items', async (req, res, next) => {
    // 어드민 일때만 생성이 가능하다.
    try {
      //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!await simpleLogic.checkAdmin(accountId)) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }

        const {
            name,
            speed,
            goalFinishing,
            shootPower,
            defense,
            stamina,
            rarity,
        } = req.body;
        if (
            !name ||
            !speed ||
            !goalFinishing ||
            !shootPower ||
            !defense ||
            !stamina ||
            !rarity 
        )
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const user = await prisma.item.create({
            data: {
                name,
                speed,
                goalFinishing,
                shootPower,
                defense,
                stamina,
                rarity,
            },
        });

        return res
            .status(201)
            .json({ message: `${name}아이템이 생성되었습니다.` });
    } catch (err) {
        next(err);
    }
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
/** 새로운 아이템 생성 CSV API **/
router.post('/items/csv', upload.single('csv'), async (req, res, next) => {
    // 어드민 일때만 생성이 가능하다.
    // 주의! 잘못된 데이터이어도 에러를 피하기 위해 기본값을 다 넣어 놨음.
    try {
      //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!await simpleLogic.checkAdmin(accountId)) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }

        const csvData = req.file.buffer.toString('utf-8');
        const csvStringArr = csvData.split(/\r\n|\r|\n/);

        const csvCreateData = csvParsing(csvStringArr);

        const user = await prisma.item.createMany({
            data: csvCreateData,
        });

        return res.status(201).json({
            message: `${csvCreateData.length}개의 아이템이 생성되었습니다.`,
        });
    } catch (err) {
        next(err);
    }
});
/** 아이템 수정 API **/
router.post('/items/:itemId', async (req, res, next) => {
    // itemId를 파라미터로 받아 아이템 정보를 수정한다.
    // 어드민 일때만 수정이 가능하다.
    try {
        const { itemId } = req.params;

      //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!await simpleLogic.checkAdmin(accountId)) {
            res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
        }
        const {
            name,
            speed,
            goalFinishing,
            shootPower,
            defense,
            stamina,
            rarity,
        } = req.body;
        if (
            !itemId ||
            !name ||
            !speed ||
            !goalFinishing ||
            !shootPower ||
            !defense ||
            !stamina ||
            !rarity
        )
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const isExistPlayer = await prisma.item.findFirst({
            select: {
                itemId: true,
            },
            where: {
                itemId: +itemId,
            },
        });
        if (!isExistPlayer) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 아이템입니다.' });
        }

        const user = await prisma.item.update({
            data: {
                name,
                speed,
                goalFinishing,
                shootPower,
                defense,
                stamina,
                rarity,
            },
            where: { itemId: +itemId },
        });

        return res
            .status(200)
            .json({ message: `${name}아이템이 수정되었습니다.` });
    } catch (err) {
        next(err);
    }
});
/** 아이템 삭제 API **/
router.delete('/items/:itemsId', async (req, res, next) => {
    // 어드민 일때만 삭제가 가능하다.
    try {
        const { itemsId } = req.params;

      //어드민 체크
      const { accountId } = req.account;
      if (!accountId) {
          res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
      }
      if (!await simpleLogic.checkAdmin(accountId)) {
          res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
      }

        if (!itemsId)
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const isExistItem = await prisma.item.findFirst({
            select: {
                itemId: true,
                name: true,
            },
            where: {
                itemId: +itemsId,
            },
        });
        if (!isExistItem) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 아이템입니다.' });
        }

        const user = await prisma.item.delete({
            where: { itemId: +itemsId },
        });

        return res
            .status(200)
            .json({ message: `${isExistItem.name}아이템이 삭제되었습니다.` });
    } catch (err) {
        next(err);
    }
});

// //csv 파일을 배열로 변환
function csvParsing(csvString) {
    //item 테이블 데이터

//     itemId        Int         @id @default(autoincrement())
//     name          String
//     speed         Int
//     goalFinishing Int
//     shootPower    Int
//     defense       Int
//     stamina       Int
//     rarity        Int
//     itemImage     String?

    //리턴할 변수
    let itemCreateData = [];
    // 헤더 기준으로 데이터 인덱스 저장
    let     
    indexName = -1,
    indexSpeed = -1,
    indexGoalFinishing = -1,
    indexShootPower    = -1,
    indexDefense       = -1,
    indexStamina       = -1,
    indexRarity        = -1,
    indexItemImage     = -1;
    //헤더 확인
    const scvHeaderSplit = csvString[0].split(',');
    for (let i in scvHeaderSplit) {
        switch (scvHeaderSplit[i].toLowerCase()) {
            case 'name':
            case `full_name`:
                indexName = i;
                break;
            case 'speed':
                indexSpeed = i;
                break;
            case 'goalfinishing':
                indexGoalFinishing = i;
                break;
            case 'shootpower':
                indexShootPower = i;
                break;
            case 'defense':
                indexDefense = i;
                break;
            case 'stamina':
                indexStamina = i;
                break;
            case 'rarity':
                indexRarity = i;
                break;
            case 'itemimage':
                indexItemImage = i;
                break;
            default:
                break;
        }
    }
    // 내용 리턴 변수에 대입
    for (let i = 1; i < csvString.length; i++) {
        const csvSingleLine = csvString[i].split(',');
        if (csvSingleLine.length <= 0) continue;
        //1이 제일 높고 10이 제일 낮음으로 계산을 위해 (11- 레어도) 적용
        const tmpRarity = (11 - (csvSingleLine[indexRarity] ?? simpleLogic.getRandomInt(1, 11)));
        const singleItemData = {
            name: csvSingleLine[indexName] ?? '무명',
            speed:
                +(csvSingleLine[indexSpeed] ??
                simpleLogic.getRandomInt(1, 5) * tmpRarity),
            goalFinishing:
                +(csvSingleLine[indexGoalFinishing] ??
                simpleLogic.getRandomInt(1, 5) * tmpRarity),
            shootPower:
                +(csvSingleLine[indexShootPower] ??
                simpleLogic.getRandomInt(1, 5) * tmpRarity),
            defense:
                +(csvSingleLine[indexDefense] ??
                simpleLogic.getRandomInt(1, 5) * tmpRarity),
            stamina:
                +(csvSingleLine[indexStamina] ??
                simpleLogic.getRandomInt(1, 5) * tmpRarity),
                //레어도 복구
                rarity: +(csvSingleLine[indexRarity] ?? (11 - tmpRarity)),
            itemImage: csvSingleLine[indexItemImage] ?? '',
        };
        itemCreateData.push(singleItemData);
    }
    return itemCreateData;
}

 export default router;
