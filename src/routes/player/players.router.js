// src/routes/players.router.js
import express from 'express';
import multer from 'multer';
import simpleLogic from '../../logic/simpleLogic.js';
import { prisma } from '../../utils/prisma/index.js';
import { isValidInput } from '../teammember/createRoster.router.js';

const router = express.Router();

/** 선수 목록 조회 API **/
router.get('/players', async (req, res, next) => {
    // id, 이름, 레어도를 조회한다.
    try {
        const playerList = await prisma.player.findMany({
            select: {
                playerId: true,
                name: true,
                rarity: true,
            },
        });
        // 정상적으로 조회시 res
        return res.status(200).json({ ...playerList });
    } catch (err) {
        next(err);
    }
});
/** 선수 상세 조회 API **/
router.get('/players/:playerId', async (req, res, next) => {
    // playerId를 파라미터로 받아 상세한 정보를 조회한다.
    // 어드민 여부에 따라 다른 정보가 조회된다.
    try {
        const { playerId } = req.params;
        if (!playerId)
            return res
                .status(400)
                .json({ message: 'playerId가 입력되지 않았습니다.' });
        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }

        let isExistPlayer;
        if (await simpleLogic.checkAdmin(accountId)) {
            isExistPlayer = await prisma.player.findFirst({
                select: {
                    playerId: true,
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
                where: {
                    playerId: +playerId,
                },
            });
        } else {
            isExistPlayer = await prisma.player.findFirst({
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
                where: {
                    playerId: +playerId,
                },
            });
        }

        if (!isExistPlayer) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 선수입니다.' });
        }
        return res.status(200).json(isExistPlayer);
    } catch (err) {
        next(err);
    }
});
/** 새로운 선수 생성 API **/
router.post('/players', async (req, res, next) => {
    // 어드민 일때만 생성이 가능하다.
    try {
        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!(await simpleLogic.checkAdmin(accountId))) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }

        const {
            name,
            club,
            speed,
            goalFinishing,
            shootPower,
            defense,
            stamina,
            rarity,
            type,
        } = req.body;
        if (
            !name ||
            !club ||
            !speed ||
            !goalFinishing ||
            !shootPower ||
            !defense ||
            !stamina ||
            !rarity ||
            !type
        )
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const user = await prisma.player.create({
            data: {
                name,
                club,
                speed,
                goalFinishing,
                shootPower,
                defense,
                stamina,
                rarity,
                type,
            },
        });

        return res
            .status(201)
            .json({ message: `${name}선수가 생성되었습니다.` });
    } catch (err) {
        next(err);
    }
});
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
/** 새로운 선수 생성 CSV API **/
router.post('/players/csv', upload.single('csv'), async (req, res, next) => {
    // 어드민 일때만 생성이 가능하다.
    // 주의! 잘못된 데이터이어도 에러를 피하기 위해 기본값을 다 넣어 놨음.
    try {
        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!(await simpleLogic.checkAdmin(accountId))) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }

        const csvData = req.file.buffer.toString('utf-8');
        const csvStringArr = csvData.split(/\r\n|\r|\n/);

        const csvCreateData = csvParsing(csvStringArr);

        const user = await prisma.player.createMany({
            data: csvCreateData,
        });

        return res.status(201).json({
            message: `${csvCreateData.length}명의 선수가 생성되었습니다.`,
        });
    } catch (err) {
        next(err);
    }
});
/** 선수 수정 API **/
router.post('/players/:playerId', async (req, res, next) => {
    // playerId를 파라미터로 받아 선수 정보를 수정한다.
    // 어드민 일때만 수정이 가능하다.
    try {
        const { playerId } = req.params;

        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!(await simpleLogic.checkAdmin(accountId))) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }
        const {
            name,
            club,
            speed,
            goalFinishing,
            shootPower,
            defense,
            stamina,
            rarity,
            type,
        } = req.body;
        if (
            !playerId ||
            !name ||
            !club ||
            !speed ||
            !goalFinishing ||
            !shootPower ||
            !defense ||
            !stamina ||
            !rarity ||
            !type
        )
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const isExistPlayer = await prisma.player.findFirst({
            select: {
                playerId: true,
            },
            where: {
                playerId: +playerId,
            },
        });
        if (!isExistPlayer) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 선수입니다.' });
        }

        const user = await prisma.player.update({
            data: {
                name,
                club,
                speed,
                goalFinishing,
                shootPower,
                defense,
                stamina,
                rarity,
                type,
            },
            where: { playerId: +playerId },
        });

        return res
            .status(200)
            .json({ message: `${name}선수가 수정되었습니다.` });
    } catch (err) {
        next(err);
    }
});
/** 선수 삭제 API **/
router.delete('/players/:playerId', async (req, res, next) => {
    // 어드민 일때만 삭제가 가능하다.
    try {
        const { playerId } = req.params;

        //어드민 체크
        const { accountId } = req.account;
        if (!accountId) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }
        if (!(await simpleLogic.checkAdmin(accountId))) {
            return res
                .status(500)
                .json({ message: '서버에 이상이 생겼습니다.' });
        }

        if (!playerId)
            return res
                .status(400)
                .json({ message: '데이터 형식이 올바르지 않습니다.' });

        const isExistPlayer = await prisma.player.findFirst({
            select: {
                playerId: true,
                name: true,
            },
            where: {
                playerId: +playerId,
            },
        });
        if (!isExistPlayer) {
            return res
                .status(404)
                .json({ message: '존재하지 않는 선수입니다.' });
        }

        const user = await prisma.player.delete({
            where: { playerId: +playerId },
        });

        return res
            .status(200)
            .json({ message: `${isExistPlayer.name}선수가 삭제되었습니다.` });
    } catch (err) {
        next(err);
    }
});

//csv 파일을 배열로 변환
function csvParsing(csvString) {
    //player 테이블 데이터

    // playerId      Int          @id @default(autoincrement()) @map("playerId")
    // name          String       @map("name")
    // club          String       @map("club")
    // speed         Int          @map("speed")
    // goalFinishing Int          @map("goalFinishing")
    // shootPower    Int          @map("shootPower")
    // defense       Int          @map("defense")
    // stamina       Int          @map("stamina")
    // rarity        Int          @map("rarity")
    // type          Int?         @map("type")
    // playerImage   String?      @map("playerImage")

    //리턴할 변수
    let playerCreateData = [];
    // 헤더 기준으로 데이터 인덱스 저장
    let indexName = -1,
        indexClub = -1,
        indexSpeed = -1,
        indexGoalFinishing = -1,
        indexShootPower = -1,
        indexDefense = -1,
        indexStamina = -1,
        indexRarity = -1,
        indexType = -1,
        indexplayerImage = -1;

    //헤더 확인
    const scvHeaderSplit = csvString[0].split(',');
    for (let i in scvHeaderSplit) {
        switch (scvHeaderSplit[i].toLowerCase()) {
            case 'name':
            case `full_name`:
                indexName = i;
                break;
            case 'club':
            case `current club`:
                indexClub = i;
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
            case 'type':
                indexType = i;
                break;
            case 'playerimage':
                indexplayerImage = i;
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
        const tmpRarity =
            11 -
            (csvSingleLine[indexRarity] ?? simpleLogic.getRandomInt(1, 11));
        const singlePlayerData = {
            name: csvSingleLine[indexName] ?? '무명',
            club: csvSingleLine[indexClub] ?? '조기축구회',
            speed: +(
                csvSingleLine[indexSpeed] ??
                30 + simpleLogic.getRandomInt(1, 10) * tmpRarity
            ),
            goalFinishing: +(
                csvSingleLine[indexGoalFinishing] ??
                30 + simpleLogic.getRandomInt(1, 10) * tmpRarity
            ),
            shootPower: +(
                csvSingleLine[indexShootPower] ??
                30 + simpleLogic.getRandomInt(1, 10) * tmpRarity
            ),
            defense: +(
                csvSingleLine[indexDefense] ??
                30 + simpleLogic.getRandomInt(1, 10) * tmpRarity
            ),
            stamina: +(
                csvSingleLine[indexStamina] ??
                30 + simpleLogic.getRandomInt(1, 10) * tmpRarity
            ),
            //레어도 복구
            rarity: +(csvSingleLine[indexRarity] ?? 11 - tmpRarity),
            type: +(csvSingleLine[indexType] ?? 1),
            playerImage: csvSingleLine[indexplayerImage] ?? '',
        };
        playerCreateData.push(singlePlayerData);
    }
    return playerCreateData;
}

export default router;
