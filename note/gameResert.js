router.post('/cash/game-result', async (req, res, next) => {
    const { winnerNickname, loserNickname, result, betAmount } = req.body;

    try {
        // 입력값 검증
        if (
            !winnerNickname ||
            !loserNickname ||
            !result ||
            !betAmount ||
            betAmount <= 0
        ) {
            return res.status(400).json({
                message:
                    '승자, 패자 닉네임, 결과, 그리고 0 이상의 배팅 금액을 입력해주세요.',
            });
        }

        // 승자 데이터 확인
        const winner = await prisma.manager.findFirst({
            where: { nickname: winnerNickname },
            select: { cash: true },
        });
        if (!winner) {
            return res
                .status(404)
                .json({ message: '승자 닉네임이 존재하지 않습니다.' });
        }

        // 패자 데이터 확인
        const loser = await prisma.manager.findFirst({
            where: { nickname: loserNickname },
            select: { cash: true },
        });
        if (!loser) {
            return res
                .status(404)
                .json({ message: '패자 닉네임이 존재하지 않습니다.' });
        }

        // 배팅 금액 유효성 확인
        if (loser.cash < betAmount) {
            return res
                .status(400)
                .json({ message: '패자의 캐시가 부족합니다.' });
        }

        let winnerReward = 0;
        let loserPenalty = 0;

        if (result === 'win') {
            // 승리: 승자에게 배팅 금액만큼 지급, 패자에게 배팅 금액만큼 감소
            winnerReward = betAmount;
            loserPenalty = betAmount;
        } else if (result === 'draw') {
            // 무승부: 승자에게 배팅 금액의 절반만 지급, 패자는 그대로
            winnerReward = Math.floor(betAmount / 2);
            loserPenalty = 0; // 무승부일 때는 패자에게 영향 없음
        } else if (result === 'lose') {
            // 패배: 승자에게 배팅 금액만큼 감소
            return res.status(400).json({
                message: '결과는 "win" 또는 "draw"여야 합니다.',
            });
        }

        // 데이터 업데이트
        await prisma.manager.update({
            where: { nickname: winnerNickname },
            data: { cash: winner.cash + winnerReward },
        });

        if (loserPenalty > 0) {
            await prisma.manager.update({
                where: { nickname: loserNickname },
                data: { cash: loser.cash - loserPenalty },
            });
        }

        return res.status(200).json({
            message: `결과: ${result}, ${winnerNickname}님이 ${winnerReward}캐시를 획득했습니다.`,
        });
    } catch (error) {
        console.error('Error processing game result:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
