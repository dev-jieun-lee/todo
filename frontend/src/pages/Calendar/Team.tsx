// 📅 공용 캘린더 > 팀 일정 보기
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore";
import { ChevronLeft, ChevronRight, Calendar, Users, UserCheck, UserX, X } from "lucide-react";
import api from "../../utils/axiosInstance";
import { useUser } from "../../contexts/useUser";
import { useNavigate } from "react-router-dom";

dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface TeamMember {
  id: number;
  name: string;
  position_code: string;
  position_label: string;
  team_code: string;
  department_code: string;
}

interface VacationEvent {
  id: number;
  user_id: number;
  user_name: string;
  type_code: string;
  type_label: string;
  start_date: string;
  end_date: string;
  status: string;
  reason?: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: 'vacation' | 'holiday';
  status: string;
  user_name: string;
  color: string;
}

interface HolidayEvent {
  id: number;
  date: string;
  name: string;
  year: number;
  month: number;
  day: number;
  is_recurring: number;
}

const Team = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [vacations, setVacations] = useState<VacationEvent[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const user = useUser();
  const [modalOpen, setModalOpen] = useState<null | 'working' | 'vacation'>(null);
  const navigate = useNavigate();

  // 현재 월의 첫째 주와 마지막 주 계산
  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startOfCalendar = startOfMonth.startOf('week');
  const endOfCalendar = endOfMonth.endOf('week');

  // 캘린더 날짜 배열 생성
  const calendarDays = [];
  let day = startOfCalendar;
  while (day.isBefore(endOfCalendar) || day.isSame(endOfCalendar, 'day')) {
    calendarDays.push(day);
    day = day.add(1, 'day');
  }

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // 팀원 정보 로드
        const membersResponse = await api.get('/user/team-members', {
          params: { team_code: user?.team_code }
        });
        setTeamMembers(membersResponse.data || []);

        // 팀원들의 휴가 정보 로드
        const vacationsResponse = await api.get('/vacations/team', {
          params: { 
            team_code: user?.team_code,
            start_date: startOfMonth.format('YYYY-MM-DD'),
            end_date: endOfMonth.format('YYYY-MM-DD')
          }
        });
        setVacations(vacationsResponse.data || []);

        // 공휴일 정보 로드
        const holidaysResponse = await api.get('/holidays', {
          params: {
            year: currentDate.year()
          }
        });

        // 이벤트 데이터 생성
        const vacationEvents: CalendarEvent[] = vacationsResponse.data?.map((vacation: VacationEvent) => ({
          id: vacation.id,
          title: `${vacation.user_name} ${vacation.type_label}`,
          date: vacation.start_date,
          type: 'vacation' as const,
          status: vacation.status,
          user_name: vacation.user_name,
          color: getVacationColor(vacation.type_code, vacation.status)
        })) || [];

        const holidayEvents: CalendarEvent[] = holidaysResponse.data?.map((holiday: HolidayEvent) => ({
          id: -holiday.id, // 음수 ID로 공휴일 구분
          title: holiday.name,
          date: holiday.date,
          type: 'holiday' as const,
          status: '공휴일',
          user_name: '',
          color: 'bg-red-100 text-red-800'
        })) || [];

        setEvents([...vacationEvents, ...holidayEvents]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
        // API 오류 시 빈 배열로 설정
        setTeamMembers([]);
        setVacations([]);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate, user?.team_code]);

  // 휴가 타입별 색상
  const getVacationColor = (typeCode: string, status: string) => {
    if (status !== 'APPROVED') {
      return 'bg-gray-100 text-gray-600';
    }
    
    switch (typeCode) {
      case 'ANNUAL':
        return 'bg-blue-100 text-blue-800';
      case 'SICK':
        return 'bg-red-100 text-red-800';
      case 'HALF':
        return 'bg-yellow-100 text-yellow-800';
      case 'MATERNITY':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  // 특정 날짜의 이벤트 가져오기
  const getEventsForDate = (date: dayjs.Dayjs) => {
    return events.filter(event => 
      dayjs(event.date).isSame(date, 'day')
    );
  };

  // 이전/다음 월 이동
  const goToPreviousMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const goToNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  // 오늘 날짜인지 확인
  const isToday = (date: dayjs.Dayjs) => {
    return date.isSame(dayjs(), 'day');
  };

  // 오늘 날짜
  const today = dayjs();

  // 오늘 휴가중인 팀원만 필터
  const vacationMembers = teamMembers.filter(member => {
    const vac = vacations.find(v => v.user_id === member.id && v.status === 'APPROVED');
    if (!vac) return false;
    // 오늘이 휴가 기간 내에 포함되는지 확인
    return dayjs(today).isSameOrAfter(dayjs(vac.start_date), 'day') && dayjs(today).isSameOrBefore(dayjs(vac.end_date), 'day');
  });
  const workingMembers = teamMembers.filter(member => !vacationMembers.includes(member));

  // ESC로 모달 닫기
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  // 모달 내용
  const renderModal = () => {
    if (!modalOpen) return null;
    const list = modalOpen === 'working' ? workingMembers : vacationMembers;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30 transition-opacity duration-200 animate-fadein">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] relative transition-all duration-200 transform animate-modalpop">
          <button className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded" onClick={() => setModalOpen(null)}>
            <X size={18} />
          </button>
          <h3 className="text-lg font-semibold mb-4">
            {modalOpen === 'working' ? '출근 중인 팀원' : '휴가 중인 팀원'}
          </h3>
          {list.length === 0 ? (
            <div className="text-gray-500">팀원이 없습니다.</div>
          ) : (
            <ul className="space-y-2">
              {list.map(member => (
                <li key={member.id} className="flex items-center gap-2">
                  <span
                    className="font-medium cursor-pointer text-blue-700 hover:underline hover:text-blue-900 transition-colors"
                    onClick={() => navigate(`/profile/${member.id}`)}
                  >
                    {member.name}
                  </span>
                  <span className="text-xs text-gray-500">{member.position_label}</span>
                  {modalOpen === 'vacation' && (
                    <span className="text-xs text-red-600 ml-2">
                      {vacations.find(v => v.user_id === member.id && v.status === 'APPROVED')?.type_label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">📆 팀 일정 보기</h2>
        <p className="text-gray-600">팀별 월간/주간 일정을 확인할 수 있습니다.</p>
      </div>

      {/* 캘린더 헤더 + 통계 + 범례 */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between p-4 border-b flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-xl font-semibold">
              {currentDate.format('YYYY년 MM월')}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>
          {/* 통계 요약 + 범례 */}
           <div className="flex gap-6 items-center flex-wrap">
            <div className="flex gap-4 items-center">
              <div className="flex items-center gap-2">
                <Users className="text-blue-600" size={18} />
                <span className="font-semibold text-blue-700">전체 팀원</span>
                <span className="text-base font-bold text-blue-600">{teamMembers.length}명</span>
              </div>
              <button
                className="flex items-center gap-2 hover:bg-green-50 px-2 py-1 rounded"
                onClick={() => setModalOpen('working')}
              >
                <UserCheck className="text-green-600" size={18} />
                <span className="font-semibold text-green-700">출근 중</span>
                <span className="text-base font-bold text-green-600">{workingMembers.length}명</span>
              </button>
              <button
                className="flex items-center gap-2 hover:bg-red-50 px-2 py-1 rounded"
                onClick={() => setModalOpen('vacation')}
              >
                <UserX className="text-red-600" size={18} />
                <span className="font-semibold text-red-700">휴가 중</span>
                <span className="text-base font-bold text-red-600">{vacationMembers.length}명</span>
              </button>
            </div>
            {/* 범례 */}
            <div className="flex flex-wrap gap-4 ml-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span className="text-sm">연차</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span className="text-sm">병가</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span className="text-sm">반차</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-pink-100 rounded"></div>
                <span className="text-sm">출산휴가</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 rounded"></div>
                <span className="text-sm">공휴일</span>
              </div>
            </div>
          </div>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 border-b">
          {['일', '월', '화', '수', '목', '금', '토'].map(day => (
            <div key={day} className="p-3 text-center font-medium text-gray-600">
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dayEvents = getEventsForDate(date);
            const isCurrentMonth = date.month() === currentDate.month();
            const today = isToday(date);
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${today ? 'bg-blue-200 border-blue-400' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${today ? 'text-blue-900' : ''}`}>
                  {date.date()}
                </div>
                {/* 이벤트 표시 */}
                <div className="space-y-1">
                  {dayEvents.slice(0, 3).map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded truncate ${event.color}`}
                      title={`${event.title} - ${event.user_name}`}
                    >
                      <div className="flex items-center gap-1">
                        {event.type === 'vacation' ? (
                          <Calendar size={10} />
                        ) : (
                          <span className="text-xs">🎉</span>
                        )}
                        {event.title}
                      </div>
                    </div>
                  ))}
                  {dayEvents.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{dayEvents.length - 3}개 더
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 출근/휴가 모달 */}
      {renderModal()}
    </div>
  );
};

/* Tailwind에 없는 애니메이션을 위한 스타일 추가 */
// 아래 코드를 파일 맨 아래에 추가

/* eslint-disable */
import React from 'react';

// 파일 맨 아래에 추가
const style = `
@keyframes fadein {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes modalpop {
  0% { opacity: 0; transform: scale(0.95) translateY(20px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-fadein {
  animation: fadein 0.2s ease;
}
.animate-modalpop {
  animation: modalpop 0.25s cubic-bezier(0.22, 1, 0.36, 1);
}
`;

export default Team;

// 스타일 인젝션
if (typeof window !== 'undefined' && !document.getElementById('team-modal-anim')) {
  const styleTag = document.createElement('style');
  styleTag.id = 'team-modal-anim';
  styleTag.innerHTML = style;
  document.head.appendChild(styleTag);
}
