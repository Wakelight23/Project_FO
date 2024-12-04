import express from 'express';
import { prisma } from '../../utils/prisma/index.js';
import {
  calculatePlayerPower,
  determineWinner,
  updateGameResult,
} from '../../logic/gameplay.js';

const router = express.Router();

// 대장전 게임 세션 생성
const captainGameSession = new Map();

/** 대장전 게임 시작 API = POST로 처리 **/
// 입력할 정보 : 상대할 accountId, 내 TeamMember 중 isSelected된 선수 중 택 1
router.post('/captain/start', async (req, res) => {
  try {
    const { myAccountId, opponentAccountId, selectedPlayerId } = req.body;

    // 계정 확인
    const myAccount = await prisma.account.findUnique({
      where: { accountId: Number(myAccountId) },
    });

    if (!myAccount) {
      return res.status(404).json({ error: '내 계정을 찾을 수 없습니다.' });
    }

    // 상대방 계정 확인
    const opponentAccount = await prisma.account.findUnique({
      where: { accountId: Number(opponentAccountId) },
    });

    if (!opponentAccount) {
      return res.status(404).json({ error: '상대방 계정을 찾을 수 없습니다.' });
    }

    // 선택한 선수 확인
    const myManager = await prisma.manager.findUnique({
      where: { accountId: Number(myAccountId) },
    });

    // 보유 중인 모든 선수 목록 조회
    const myTeamMembers = await prisma.teamMember.findMany({
      where: {
        managerId: myManager.managerId,
        isSelected: true,
      },
      include: {
        player: true,
      },
    });

    const selectedPlayer = await prisma.teamMember.findFirst({
      where: {
        managerId: myManager.managerId,
        playerId: Number(selectedPlayerId),
        isSelected: true,
      },
      include: {
        player: true,
      },
    });

    if (!selectedPlayer) {
      return res.status(400).json({
        error: '선택한 선수를 찾을 수 없습니다.',
        availablePlayers: myTeamMembers.map((member) => ({
          playerId: member.playerId,
          name: member.player.name,
          isSelected: member.isSelected,
        })),
      });
    }

    // 게임 세션 생성
    captainGameSession.set(String(myAccountId), {
      startTime: new Date(),
      isGameStarted: true,
      myAccountId: Number(myAccountId),
      opponentAccountId: Number(opponentAccountId),
      selectedPlayerId: Number(selectedPlayerId),
      selectedPlayerPower: calculatePlayerPower(selectedPlayer.player),
      selectedPlayerName: selectedPlayer.player.name,
    });

    res.status(201).json({
      data: {
        message: '게임(대장전)이 시작되었습니다.',
        selectedPlayer: selectedPlayer.player.name,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/** 대장전 게임 결과 API **/
router.get('/captain/result/:myAccountId', async (req, res) => {
  try {
    const { myAccountId } = req.params;

    // 게임 세션 확인
    const gameSession = captainGameSession.get(String(myAccountId));
    if (!gameSession || !gameSession.isGameStarted) {
      return res.status(400).json({
        error: '진행 중인 게임(대장전)이 없습니다.',
      });
    }

    // 상대방의 선택된 선수들 중 랜덤 선택
    const opponentManager = await prisma.manager.findUnique({
      where: { accountId: parseInt(gameSession.opponentAccountId) },
    });

    const opponentPlayers = await prisma.teamMember.findMany({
      where: {
        managerId: opponentManager.managerId,
        isSelected: true,
      },
      include: {
        player: true,
      },
    });

    // 랜덤으로 상대방 선수 선택
    const randomOpponentPlayer =
      opponentPlayers[Math.floor(Math.random() * opponentPlayers.length)];
    const opponentPlayerPower = calculatePlayerPower(
      randomOpponentPlayer.player
    );

    // 승패 결정
    const gameResult = determineWinner(
      gameSession.selectedPlayerPower,
      opponentPlayerPower
    );

    await updateGameResult(opponentManager.managerId, gameResult.result);

    // 게임 결과 저장
    await prisma.record.create({
      data: {
        managerId: opponentManager.managerId,
        gameResult: gameResult.result,
      },
    });

    // 세션 삭제
    captainGameSession.delete(myAccountId);

    res.status(200).json({
      data: {
        myPlayer: {
          name: gameSession.selectedPlayerName,
          power: Math.floor(gameSession.selectedPlayerPower),
        },
        opponentPlayer: {
          name: randomOpponentPlayer.player.name,
          power: Math.floor(opponentPlayerPower),
        },
        result:
          gameResult.result === 1
            ? '승리'
            : gameResult.result === 2
            ? '무승부'
            : '패배',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
