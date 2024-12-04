import express from 'express';
import { prisma } from '../utils/prisma/index.js';
import {
  calculateTeamPower,
  generateOpponentPower,
  determineWinner,
  updateGameResult,
} from '../logic/gameplay.js';

const router = express.Router();

// 게임 진행 상태를 저장할 Map = 게임 세션(게임 룸? 게임 방?)
const gameSessionMap = new Map();

/** 일반 게임 시작 API **/
router.get('/choicematch/:accountId/start', async (req, res) => {
  try {
    const { accountId } = req.params;

    // accountId 존재 여부 확인
    const account = await prisma.account.findUnique({
      where: { accountId: +accountId },
    });

    if (!account) {
      return res.status(404).json({
        error: '존재하지 않는 계정입니다.',
      });
    }

    // 해당 account의 manager 확인
    const manager = await prisma.manager.findUnique({
      where: { accountId: parseInt(accountId) },
    });

    if (!manager) {
      return res.status(404).json({
        error: '매니저 정보를 찾을 수 없습니다.',
      });
    }

    // 선택된 선수 확인
    const selectedPlayers = await prisma.teamMember.findMany({
      where: {
        managerId: manager.managerId,
        isSelected: true,
      },
    });

    if (selectedPlayers.length === 0) {
      return res.status(400).json({
        error: '선택된 선수가 없습니다. 선수를 먼저 선택해주세요.',
      });
    }

    // 게임 세션 생성
    gameSessionMap.set(accountId, {
      startTime: new Date(),
      isGameStarted: true,
    });

    res.status(201).json({
      data: {
        gameStart: '게임을 시작합니다',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** 일반 게임 결과 API **/
router.get('/choicematch/:accountId/result', async (req, res) => {
  try {
    const { accountId } = req.params;

    // 게임 세션 확인
    const gameSession = gameSessionMap.get(accountId);

    if (!gameSession || !gameSession.isGameStarted) {
      return res.status(400).json({
        error: '진행되고 있는 게임이 존재하지 않습니다',
      });
    }

    const manager = await prisma.manager.findUnique({
      where: { accountId: parseInt(accountId) },
    });

    const selectedPlayers = await prisma.teamMember.findMany({
      where: {
        managerId: manager.managerId,
        isSelected: true,
      },
      include: {
        player: true,
      },
    });

    const totalPower = calculateTeamPower(selectedPlayers);
    const opponentPower = generateOpponentPower(totalPower);
    const gameResult = determineWinner(totalPower, opponentPower);

    await prisma.record.create({
      data: {
        managerId: manager.managerId,
        gameResult: gameResult.result,
      },
    });

    res.status(202).json({
      data: {
        totalPower: `나의 팀 전투력 : ${Math.floor(totalPower)}`,
        opponentPower: `상대 팀 전투력 : ${Math.floor(opponentPower)}`,
        randomResult: `${gameResult.details.randomFactor}(=랜덤 수치) : ${gameResult.details.winProbability}(=내 전투력에 기반한 승률)`,
        gameResult: `${
          gameResult.result === 1
            ? '승리'
            : gameResult.result === 2
            ? '무승부'
            : '패배'
        } 입니다`,
      },
    });

    // 게임 결과 처리 후 세션 삭제
    gameSessionMap.delete(accountId);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 선택된 선수들 정보 조회
router.get('/choicematch/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params;

    // 해당 account의 manager 찾기
    const manager = await prisma.manager.findUnique({
      where: { accountId: parseInt(accountId) },
    });

    if (!manager) {
      return res.status(404).json({ message: '해당 감독을 찾을 수 없습니다.' });
    }

    // 선택된 선수들 조회
    const selectedPlayers = await prisma.teamMember.findMany({
      where: {
        managerId: manager.managerId,
        isSelected: true,
      },
      include: {
        player: true, // player 정보 포함
      },
    });

    // 전투력 계산
    const totalPower = calculateTeamPower(selectedPlayers);

    // 상대방 전투력 생성 (현재 전투력의 80~120% 범위)
    const opponentPower = generateOpponentPower(totalPower);

    // 승패 결정
    const gameResult = determineWinner(totalPower, opponentPower);

    // 게임 결과 저장
    await prisma.record.create({
      data: {
        managerId: manager.managerId,
        gameResult: gameResult.result, // 1: 승리, 0: 패배
      },
    });

    res.json({
      myTeam: {
        players: selectedPlayers,
        power: totalPower,
      },
      opponent: {
        power: opponentPower,
      },
      result: gameResult,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
