'use client'; // 클라이언트 컴포넌트로 설정

import styles from './page.module.css';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebaseConfig'; // Firebase 설정 파일 경로
import Signup from './Signup'; // 회원가입 컴포넌트
import Login from './Login'; // 로그인 컴포넌트

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false); // 로그인 상태 추가
  const [showSignup, setShowSignup] = useState(false); // 회원가입 입력란 표시
  const [showLogin, setShowLogin] = useState(false); // 로그인 입력란 표시

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        setIsLoggedIn(true); // 로그인 상태 업데이트
        setShowLogin(false); // 로그인 입력란 숨기기
        setShowSignup(false); // 회원가입 입력란 숨기기
      }
    });
    return () => unsubscribe();
  }, []);

  const handleDailyPlannerClick = () => {
    const today = new Date();
    const formattedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    router.push(`/daily?date=${formattedDate}`);
  };

  const handleDashboardClick = () => {
    router.push('/dashboard'); // 대시보드로 이동
  };

  const handleLogout = async () => {
    await auth.signOut(); // 로그아웃
    setIsLoggedIn(false); // 로그인 상태 업데이트
    router.push('/'); // 원래 페이지로 돌아가기
  };

  const handleGoHome = () => {
    setShowLogin(false);
    setShowSignup(false);
    setIsLoggedIn(false);
  };

  return (
    <main className={styles.main}>
      <div className={styles.content}>
        <h1 className={styles.title}>마이 플래너</h1>
        {!isLoggedIn && !showSignup && !showLogin && (
          <div className={styles.buttonContainer}>
            <button onClick={() => { setShowSignup(true); setShowLogin(false); }} className={styles.button}>
              회원가입
            </button>
            <button onClick={() => { setShowLogin(true); setShowSignup(false); }} className={styles.button}>
              로그인
            </button>
          </div>
        )}
        {showSignup && (
          <>
            <Signup onSuccess={() => setIsLoggedIn(true)} />
            <p className={styles.goHome} onClick={handleGoHome}>처음으로 돌아가기</p> {/* 클릭 시 원래 페이지로 돌아가기 */}
          </>
        )}
        {showLogin && (
          <>
            <Login onLoginSuccess={() => setIsLoggedIn(true)} />
            <p className={styles.goHome} onClick={handleGoHome}>처음으로 돌아가기</p> {/* 클릭 시 원래 페이지로 돌아가기 */}
          </>
        )}
        {isLoggedIn && (
          <div className={styles.loggedInContainer}>
            <button onClick={handleDashboardClick} className={styles.button}>
              대시보드로 이동
            </button>
            <button onClick={handleDailyPlannerClick} className={styles.button}>
              일일 플래너
            </button>
            <button onClick={handleLogout} className={styles.button}>
              로그아웃
            </button>
          </div>
        )}
      </div>
    </main>
  );
}