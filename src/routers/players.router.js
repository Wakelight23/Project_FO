// src/routes/players.router.js

import express from 'express';
import { prisma } from '../utils/prisma/index.js';

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
  const { accountID } = req.accountID;

  const { playerId } = req.params;
  if (!playerId)
    res.status(400).json({ message: 'playerId가 입력되지 않았습니다.' });

  try {
    const isAdmin = await prisma.account.findFirst({
      select: {
        accountId: true,
        isAdmin: true,
      },
      where: {
        accountId: +accountID,
      },
    });
    let isExistPlayer;
    if (isAdmin) {
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
      res.status(404).json({ message: '존재하지 않는 선수입니다.' });
    }
    return res.status(200).json(playerList);
  } catch (err) {
    next(err);
  }
});
/** 새로운 선수 생성 API **/
router.post('/players', async (req, res, next) => {
  // 어드민 일때만 생성이 가능하다.
  //const { accountID } = req.accountID;
  try {
    // const isAdmin = await prisma.account.findFirst({
    //   select: {
    //     accountId: true,
    //     isAdmin: true,
    //   },
    //   where: {
    //     accountId: +accountID,
    //   },
    // });
    // if (!isAdmin) {
    //   res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
    // }

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
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

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

    return res.status(200).json({ message: `${name}선수가 생성되었습니다.` });
  } catch (err) {
    next(err);
  }
});
/** 선수 수정 API **/
router.post('/players/:playerId', async (req, res, next) => {
  // playerId를 파라미터로 받아 선수 정보를 수정한다.
  // 어드민 일때만 수정이 가능하다.
  try {
    //const { accountID } = req.accountID;
    const { playerId } = req.params;

    // const isAdmin = await prisma.account.findFirst({
    //   select: {
    //     accountId: true,
    //     isAdmin: true,
    //   },
    //   where: {
    //     accountId: +accountID,
    //   },
    // });
    // if (!isAdmin) {
    //   res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
    // }
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
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

    const isExistPlayer = await prisma.player.findFirst({
      select: {
        playerId: true,
      },
      where: {
        playerId: +playerId,
      },
    });
    if (!isExistPlayer) {
      res.status(404).json({ message: '존재하지 않는 선수입니다.' });
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

    return res.status(200).json({ message: `${name}선수가 수정되었습니다.` });
  } catch (err) {
    next(err);
  }
});
/** 선수 삭제 API **/
router.delete('/players/:playerId', async (req, res, next) => {
  // 어드민 일때만 삭제가 가능하다.
  try {
    //const { accountID } = req.accountID;
    const { playerId } = req.params;

    // const isAdmin = await prisma.account.findFirst({
    //   select: {
    //     accountId: true,
    //     isAdmin: true,
    //   },
    //   where: {
    //     accountId: +accountID,
    //   },
    // });
    // if (!isAdmin) {
    //   res.status(500).json({ message: '서버에 이상이 생겼습니다.' });
    // }
    if (!playerId)
      res.status(400).json({ message: '데이터 형식이 올바르지 않습니다.' });

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
      res.status(404).json({ message: '존재하지 않는 선수입니다.' });
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

export default router;
