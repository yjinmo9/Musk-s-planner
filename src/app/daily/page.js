'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import styles from './daily.module.css';

const COLORS = {
  blue: '#4A90E2',
  green: '#50C878',
  yellow: '#FFD700',
  purple: '#9370DB',
  pink: '#FF69B4'
};

export default function Daily() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date') || '';

  // 현재 날짜
  const [currentDate] = useState(() =>
    dateParam ? new Date(dateParam) : new Date()
  );

  // 선택한 색상 상태
  const [selectedColor, setSelectedColor] = useState('blue');

  // TIME PLAN 등 전체 데이터
  const [plannerData, setPlannerData] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem(`planner_${dateParam}`);
      return savedData
        ? JSON.parse(savedData)
        : {
            mainThings: Array(5).fill(''),
            brainDump: '',
            timeBlocks: Array(21).fill().map(() => ({
              segments: Array(6).fill().map(() => ({
                content: '',
                color: null
              }))
            })),
            checked: false
          };
    }
    return {
      mainThings: Array(5).fill(''),
      brainDump: '',
      timeBlocks: Array(21).fill().map(() => ({
        segments: Array(6).fill().map(() => ({
          content: '',
          color: null
        }))
      })),
      checked: false
    };
  });

  // plannerData 변경 시 로컬 스토리지에 저장
  useEffect(() => {
    if (!dateParam) return;
    localStorage.setItem(`planner_${dateParam}`, JSON.stringify(plannerData));
    updateDailyPlannerDates();
  }, [plannerData, dateParam]);

  // 날짜 목록에도 저장
  const updateDailyPlannerDates = () => {
    const savedDates = JSON.parse(localStorage.getItem('dailyPlannerDates') || '[]');
    if (dateParam && !savedDates.includes(dateParam)) {
      savedDates.push(dateParam);
      localStorage.setItem('dailyPlannerDates', JSON.stringify(savedDates));
    }
  };

  // MAIN THINGS / BRAIN DUMP / 체크박스
  const handleMainThingChange = (index, value) => {
    setPlannerData((prev) => ({
      ...prev,
      mainThings: prev.mainThings.map((item, i) => (i === index ? value : item))
    }));
  };
  const handleBrainDumpChange = (value) => {
    setPlannerData((prev) => ({
      ...prev,
      brainDump: value
    }));
  };
  const toggleCheck = () => {
    setPlannerData((prev) => ({
      ...prev,
      checked: !prev.checked
    }));
  };

  // 드래그 관련 상태 & 함수들
  const [isColoring, setIsColoring] = useState(false);  
  const [isErasing, setIsErasing] = useState(false);    
  const [selectedTimeBlocks, setSelectedTimeBlocks] = useState([]); 

  // 입력 모달 상태
  const [showInputModal, setShowInputModal] = useState(false);
  const [currentInput, setCurrentInput] = useState('');

  // (A) 마우스 다운
  const handleMouseDown = (e, hour, segment) => {
    const isRightClick = (e.button === 2); // 우클릭
    const currentSegment = plannerData.timeBlocks[hour - 4].segments[segment];

    // 이미 색칠된 곳이거나 우클릭 → 지우기 모드
    if (currentSegment.color || isRightClick) {
      setIsErasing(true);
      setSelectedTimeBlocks([{
        hour,
        segment,
        prevColor: currentSegment.color,
        prevContent: currentSegment.content
      }]);
      // 즉시 색 지우기
      applyColor(hour, segment, null);
    } else {
      setIsErasing(false);
      setSelectedTimeBlocks([{
        hour,
        segment,
        prevColor: currentSegment.color,
        prevContent: currentSegment.content
      }]);
      // 즉시 선택한 색으로 칠하기
      applyColor(hour, segment, selectedColor);
    }
    setIsColoring(true);
  };

  // (B) 마우스 드래그
  const handleMouseEnter = (hour, segment) => {
    if (isColoring) {
      const currentSegment = plannerData.timeBlocks[hour - 4].segments[segment];
      setSelectedTimeBlocks((prev) => [
        ...prev,
        {
          hour,
          segment,
          prevColor: currentSegment.color,
          prevContent: currentSegment.content
        }
      ]);
      if (isErasing) {
        applyColor(hour, segment, null);
      } else {
        applyColor(hour, segment, selectedColor);
      }
    }
  };

  // (C) 마우스 업
  const handleMouseUp = () => {
    if (!isColoring) return;

    if (selectedTimeBlocks.length > 0) {
      if (isErasing) {
        // 이미 색을 null로 바꿨으므로 내용도 지우고 싶다면 아래에서 적용
        selectedTimeBlocks.forEach(({ hour, segment }) => {
          applyContent(hour, segment, '');
        });
      } else {
        // 색칠 모드 -> 모달 표시
        setShowInputModal(true);
      }
    }
    setIsColoring(false);
    setIsErasing(false);
  };

  // 우클릭 메뉴 비활성화
  const handleContextMenu = (e) => {
    e.preventDefault();
  };

  // 색상 적용 함수
  const applyColor = (hour, segment, colorValue) => {
    setPlannerData((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((block, hIndex) =>
        hIndex === hour - 4
          ? {
              ...block,
              segments: block.segments.map((seg, sIndex) =>
                sIndex === segment
                  ? { ...seg, color: colorValue }
                  : seg
              )
            }
          : block
      )
    }));
  };

  // 텍스트 적용 함수
  const applyContent = (hour, segment, contentValue) => {
    setPlannerData((prev) => ({
      ...prev,
      timeBlocks: prev.timeBlocks.map((block, hIndex) =>
        hIndex === hour - 4
          ? {
              ...block,
              segments: block.segments.map((seg, sIndex) =>
                sIndex === segment
                  ? { ...seg, content: contentValue }
                  : seg
              )
            }
          : block
      )
    }));
  };

  // 모달에서 "확인" 시
  const handleInputSubmit = () => {
    if (currentInput.trim()) {
      // 입력된 텍스트가 있으면 → 해당 칸들에 적용
      selectedTimeBlocks.forEach(({ hour, segment }) => {
        applyContent(hour, segment, currentInput.trim());
      });
    } else {
      // 입력이 비었으면 → 칠해놓은 색상 되돌림
      selectedTimeBlocks.forEach(({ hour, segment, prevColor, prevContent }) => {
        applyColor(hour, segment, prevColor);
        applyContent(hour, segment, prevContent);
      });
    }
    // 모달 닫기
    setShowInputModal(false);
    setCurrentInput('');
    setSelectedTimeBlocks([]);
  };

  // 모달에서 "취소" 시
  const handleInputCancel = () => {
    // 칠해놓은 색상/내용 되돌리기
    selectedTimeBlocks.forEach(({ hour, segment, prevColor, prevContent }) => {
      applyColor(hour, segment, prevColor);
      applyContent(hour, segment, prevContent);
    });
    setShowInputModal(false);
    setCurrentInput('');
    setSelectedTimeBlocks([]);
  };

  return (
    <div className={styles.daily} onContextMenu={handleContextMenu}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>DAILY TIME BOX PLANNER</h1>
          <div className={styles.dateBox}>
            <div className={styles.dateLabel}>DATE</div>
            <div className={styles.date}>
              {currentDate.toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className={styles.checkboxWrapper}>
            <input 
              type="checkbox" 
              checked={plannerData.checked} 
              onChange={toggleCheck} 
            />
            <span>이 날짜를 완료로 표시하기</span>
          </div>
        </header>

        <div className={styles.content}>
          {/* 왼쪽: MAIN THINGS & BRAIN DUMP */}
          <div className={styles.leftColumn}>
            <section className={styles.mainThingsSection}>
              <h2>MAIN THINGS</h2>
              <div className={styles.mainThingsList}>
                {plannerData.mainThings.map((thing, index) => (
                  <div key={index} className={styles.mainThingItem}>
                    <div className={styles.checkboxWrapper}>
                      <input type="checkbox" className={styles.mainThingCheckbox} />
                    </div>
                    <div className={styles.inputWrapper}>
                      <input
                        type="text"
                        value={thing}
                        onChange={(e) => handleMainThingChange(index, e.target.value)}
                        className={styles.mainThingInput}
                        placeholder="주요 할 일을 입력하세요"
                      />
                      <div className={styles.inputUnderline}></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.brainDumpSection}>
              <h2>BRAIN DUMP</h2>
              <textarea
                value={plannerData.brainDump}
                onChange={(e) => handleBrainDumpChange(e.target.value)}
                className={styles.brainDumpTextarea}
                placeholder="자유롭게 기록하세요..."
              />
            </section>
          </div>

          {/* 오른쪽: 색상 선택 + TIME PLAN */}
          <div className={styles.rightColumn}>
            <div className={styles.colorPicker}>
              {Object.entries(COLORS).map(([name, color]) => (
                <button
                  key={name}
                  className={`${styles.colorButton} ${
                    selectedColor === name ? styles.selectedColor : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(name)}
                />
              ))}
            </div>

            <section className={styles.timePlanSection}>
              <h2>TIME PLAN</h2>
              <div className={styles.timeHeader}>
                <div>00</div>
                <div>10</div>
                <div>20</div>
                <div>30</div>
                <div>40</div>
                <div>50</div>
                <div>00</div>
              </div>
              <div
                className={styles.timeGrid}
                onMouseUp={handleMouseUp}
              >
                {Array.from({ length: 21 }, (_, i) => i + 4).map((hour) => (
                  <div key={hour} className={styles.timeRow}>
                    <div className={styles.timeLabel}>{hour}</div>
                    {plannerData.timeBlocks[hour - 4].segments.map((segment, index) => {
                      const bgColor = segment.color ? COLORS[segment.color] : 'transparent';
                      return (
                        <div
                          key={index}
                          className={styles.timeSegment}
                          style={{ backgroundColor: bgColor }}
                          onMouseDown={(e) => handleMouseDown(e, hour, index)}
                          onMouseEnter={() => handleMouseEnter(hour, index)}
                        >
                          {/* 
                            입력한 텍스트는 툴팁으로 표시:
                            hover 시 .tooltip을 display: block
                          */}
                          {segment.content && (
                            <div className={styles.tooltip}>
                              {segment.content}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* 드래그 후에 텍스트 입력 모달 */}
      {showInputModal && (
        <div className={styles.timeInputModal} onClick={() => handleInputCancel()}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <input
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="일정을 입력하세요"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleInputSubmit();
                }
              }}
            />
            <button onClick={handleInputSubmit}>확인</button>
            <button onClick={handleInputCancel}>취소</button>
          </div>
        </div>
      )}
    </div>
  );
}




