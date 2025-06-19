// 📅 공용 캘린더 > 팀 일정 보기
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Calendar, Users, UserCheck, UserX } from "lucide-react";
import api from "../../utils/axiosInstance";
import { useUser } from "../../contexts/useUser";

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
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const user = useUser();

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

  // 팀원별 휴가 현황
  const getMemberVacationStatus = (memberId: number) => {
    const memberVacations = vacations.filter(v => v.user_id === memberId && v.status === 'APPROVED');
    return memberVacations.length > 0 ? memberVacations[0] : null;
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

      {/* 팀원 현황 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Users size={20} />
          팀원 현황 ({teamMembers.length}명)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {teamMembers.map(member => {
            const vacation = getMemberVacationStatus(member.id);
            return (
              <div key={member.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className={`p-2 rounded-full ${vacation ? 'bg-red-100' : 'bg-green-100'}`}>
                  {vacation ? <UserX size={16} className="text-red-600" /> : <UserCheck size={16} className="text-green-600" />}
                </div>
                <div className="flex-1">
                  <div className="font-medium">{member.name}</div>
                  <div className="text-sm text-gray-500">{member.position_label}</div>
                  {vacation && (
                    <div className="text-xs text-red-600 mt-1">
                      {vacation.type_label} ({dayjs(vacation.start_date).format('MM/DD')})
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 캘린더 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between p-4 border-b">
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

          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              월간
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-sm ${
                viewMode === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              주간
            </button>
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
            
            return (
              <div
                key={index}
                className={`min-h-[120px] p-2 border-r border-b ${
                  isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                } ${isToday(date) ? 'bg-blue-50' : ''}`}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                } ${isToday(date) ? 'text-blue-600' : ''}`}>
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

      {/* 범례 */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <h4 className="font-semibold mb-3">범례</h4>
        <div className="flex flex-wrap gap-4">
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

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="text-blue-600" size={20} />
            <h4 className="font-semibold">전체 팀원</h4>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {teamMembers.length}명
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserCheck className="text-green-600" size={20} />
            <h4 className="font-semibold">출근 중</h4>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {teamMembers.filter(member => !getMemberVacationStatus(member.id)).length}명
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="text-red-600" size={20} />
            <h4 className="font-semibold">휴가 중</h4>
          </div>
          <div className="text-2xl font-bold text-red-600">
            {teamMembers.filter(member => getMemberVacationStatus(member.id)).length}명
          </div>
        </div>
      </div>
    </div>
  );
};

export default Team;
