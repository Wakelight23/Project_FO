export default function (err, req, res, next) {
  console.error(err);

  switch (err.name) {
    case 'TokenExpiredError':
      return res
        .status(401)
        .json({ error: '토큰이 만료되었습니다. 재로그인이 필요합니다.' });
    case 'JsonWebTokenError':
      return res.status(401).json({ error: '유효하지 않은 토큰입니다.' });
    case 'SyntaxError':
      return res.status(400).json({ error: '잘못된 요청입니다.' });
  }

  return res.status(500).json({ error: '서버 내부에서 에러가 발생했습니다. ' });
}
