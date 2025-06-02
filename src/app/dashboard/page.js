'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '../firebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore'; 
import styles from './dashboard.module.css';

export default function Dashboard() {
  const router = useRouter();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 월별 계획 데이터
  const [monthlyPlans, setMonthlyPlans] = useState(() => ({
    1: "1월 계획을 작성해주세요",
    2: "2월 계획을 작성해주세요",
    3: "3월 계획을 작성해주세요",
    4: "4월 계획을 작성해주세요",
    5: "5월 계획을 작성해주세요",
    6: "6월 계획을 작성해주세요",
    7: "7월 계획을 작성해주세요",
    8: "8월 계획을 작성해주세요",
    9: "9월 계획을 작성해주세요",
    10: "10월 계획을 작성해주세요",
    11: "11월 계획을 작성해주세요",
    12: "12월 계획을 작성해주세요",
  }));

  // Firestore에서 월별 계획 불러오기
  useEffect(() => {
    const fetchMonthlyPlans = async () => {
      if (auth.currentUser) {
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setMonthlyPlans(prev => ({
            ...prev,
            ...data.monthlyPlans
          }));
        }
      }
    };
    fetchMonthlyPlans();
  }, []);

  // 월별 계획이 변경될 때마다 Firestore에 저장
  useEffect(() => {
    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      setDoc(userDoc, { monthlyPlans }, { merge: true });
    }
  }, [monthlyPlans]);

  // dailyPlans 관리
  const [dailyPlans, setDailyPlans] = useState({});

  useEffect(() => {
    const fetchDailyPlans = async () => {
      if (auth.currentUser) {
        const userDoc = doc(db, 'users', auth.currentUser.uid);
        const docSnap = await getDoc(userDoc);
        if (docSnap.exists()) {
          setDailyPlans(docSnap.data().dailyPlans || {});
        }
      }
    };
    fetchDailyPlans();
  }, []);

  // 날짜 체크박스 토글 (Dashboard에서도 직접 체크할 경우)
  const handleCheckboxChange = async (date) => {
    const updatedPlans = {
      ...dailyPlans,
      [date]: {
        ...dailyPlans[date],
        checked: !dailyPlans[date]?.checked
      }
    };
    setDailyPlans(updatedPlans);

    if (auth.currentUser) {
      const userDoc = doc(db, 'users', auth.currentUser.uid);
      await setDoc(userDoc, { dailyPlans: updatedPlans }, { merge: true });
    }
  };

  // 달력 날짜 계산
  const getCalendarDays = (month) => {
    const year = new Date().getFullYear();
    const firstDay = new Date(year, month - 1, 1).getDay();
    const lastDate = new Date(year, month, 0).getDate();
    const days = [];

    // 이전 달
    const prevMonthLastDate = new Date(year, month - 1, 0).getDate();
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ date: prevMonthLastDate - i, isCurrentMonth: false });
    }

    // 현재 달
    for (let i = 1; i <= lastDate; i++) {
      days.push({ date: i, isCurrentMonth: true });
    }

    // 다음 달
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: i, isCurrentMonth: false });
    }

    return days;
  };

  // 날짜 클릭 -> Daily 페이지로 이동
  const handleDateClick = (day) => {
    if (!day.isCurrentMonth) return;
    const formattedDate = `${new Date().getFullYear()}-${String(selectedMonth).padStart(2, '0')}-${String(day.date).padStart(2, '0')}`;
    router.push(`/daily?date=${formattedDate}`);
  };

  // 월 클릭
  const handleMonthClick = (month) => {
    setSelectedMonth(month);
  };

  // 데일리 플래너(checked) 여부 확인
  const hasPlanner = (date) => {
    const formattedDate = `${new Date().getFullYear()}-${String(selectedMonth).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return dailyPlans[formattedDate]?.checked || false;
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.container}>
        <div className={styles.leftSidebar}>
          <div className={styles.plannerTitle}>
            <span> 진모's planner</span>
          </div>

          <div className={styles.monthlyPlan}>
            <span>월간 계획</span>
            <textarea
              className={styles.planTextarea}
              value={monthlyPlans[selectedMonth] || ''}
              onChange={(e) => setMonthlyPlans(prev => ({
                ...prev,
                [selectedMonth]: e.target.value
              }))}
              placeholder="이번 달 계획을 작성해주세요..."
            />
          </div>
        </div>

        <div className={styles.mainContent}>
          <div className={styles.yearTimeline}>
            {Array.from({ length: 12 }, (_, i) => {
              const month = i + 1;
              return (
                <button
                  key={i}
                  onClick={() => handleMonthClick(month)}
                  className={`${styles.monthButton} ${month === selectedMonth ? styles.selectedMonth : ''}`}
                >
                  {month}월
                  {month === selectedMonth && <div className={styles.monthIndicator} />}
                </button>
              );
            })}
          </div>

          <div className={styles.calendar}>
            <div className={styles.calendarHeader}>
              <h2>{new Date().getFullYear()}년 {selectedMonth}월</h2>
            </div>
            <div className={styles.weekDays}>
              <div>일</div>
              <div>월</div>
              <div>화</div>
              <div>수</div>
              <div>목</div>
              <div>금</div>
              <div>토</div>
            </div>
            <div className={styles.calendarGrid}>
              {getCalendarDays(selectedMonth).map((day, index) => (
                <div
                  key={index}
                  className={`${styles.calendarCell} ${!day.isCurrentMonth ? styles.otherMonth : ''}`}
                  onClick={() => handleDateClick(day)}
                >
                  <div className={styles.dateWrapper}>
                    <span>{day.date}</span>
                    {/* 초록 점: checked 상태일 때만 표시 */}
                    {day.isCurrentMonth && hasPlanner(day.date) && (
                      <span className={styles.greenDot} />
                    )}
                  </div>
                  <div className={styles.hoverIndicator} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 체크박스 목록 (대시보드에서 직접 확인용) */}
      <div>
        {Object.keys(dailyPlans).map((date) => (
          <div key={date} className={styles.planItem}>
            <input
              type="checkbox"
              checked={dailyPlans[date]?.checked || false}
              onChange={() => handleCheckboxChange(date)}
            />
            <span className={dailyPlans[date]?.checked ? styles.checked : styles.unchecked}>
              {date}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
