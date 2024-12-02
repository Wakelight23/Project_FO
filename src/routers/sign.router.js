import express from "express";
import { prisma } from "../utils/prisma/index.js";
import bcrypt from "bcrypt";

const router = express.Router();

/** 사용자 회원가입 API **/
// localhost:c/api/sign-up POST
router.post("/sign-up", async (req, res) => {
  const { email, id, password, name, age, gender } = req.body;

  // 이메일 중복 체크
  const isExistEmail = await prisma.accounts.findUnique({
    where: { email },
  });

  if (isExistEmail) {
    return res.status(409).json({ message: "이미 존재하는 이메일입니다." });
  }

  const isExistId = await prisma.accounts.findUnique({
    where: { id },
  });

  if (isExistId) {
    return res.status(409).json({ message: "이미 존재하는 id입니다." });
  }

  // (?=.*[a-z]) : 최소한 1개 이상의 소문자가 포함되어야 합니다.
  // (?=.*\d) : 최소한 1개 이상의 숫자가 포함되어야 합니다.
  // [a-z0-9]+ : 소문자와 숫자로만 이루어져야 합니다.
  // ^와 $ : 문자열의 시작과 끝을 의미합니다.
  const idForm = /^(?=.*[a-z])(?=.*\d)[a-z0-9]+$/;
  //const idForm = /^[a-z0-9]+$/;
  if (!idForm.test(id)) {
    return res
      .status(409)
      .json({ message: "id는 영어(소문자)와 숫자로만 설정해야 합니다" });
  }

  const passwordForm = /^.{1,6}$/;
  if (!passwordForm.test(password)) {
    return res
      .status(409)
      .json({ message: "password는 6자리 이하로만 설정할 수 있습니다" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 사용자 정보를 Accounts 테이블에 추가
  const newAccount = await prisma.accounts.create({
    data: {
      email,
      id,
      password: hashedPassword,
      name,
      age,
      gender: gender,
    },
  });

  return res.status(201).json({
    message: "회원가입이 완료되었습니다.",
    account_id: newAccount.account_id,
  });
});


router.post("/sign-in", async (req, res) => {
    const { id, password } = req.body;
    const accounts = await prisma.accounts.findFirst({ where: { id } });
  
    if (!accounts)
      return res.status(401).json({ message: "존재하지 않는 id입니다." });
    // 입력받은 사용자의 비밀번호와 데이터베이스에 저장된 비밀번호를 비교합니다.
    else if (!(await bcrypt.compare(password, accounts.password)))
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
  
    // 로그인에 성공하면, 사용자의 userId를 바탕으로 토큰을 생성합니다.
    const token = jwt.sign(
      {
        account_id: accounts.account_id,
      },
      // JWT를 서명하는 데 사용되는 비밀 키
      // 서버가 비밀 키를 사용하여 토큰 변조 여부를 알 수 있다
      "",
      { expiresIn: "1h" }
    );
  
    return res.status(200).json({ message: "로그인 성공", token });
  });

export default router;
