// 📅 공용 캘린더 > KPI / TODO 마감일 연동
// 이 컴포넌트는 KPI 및 To-do 마감 일정을 캘린더에 표시하는 용도입니다.
// KPI 데이터는 임시(mock) 데이터, To-do는 서비스에서 불러옴
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import { ChevronLeft, ChevronRight, Calendar, Target, CheckSquare } from "lucide-react";
import { getTodos } from "../../services/todoService";

interface KpiItem {
  id: number;
  title: string;
  target_value: number;
  current_value: number;
  due_date: string;
  status: string;
}

interface CalendarEvent {
  id: number;
  title: string;
  date: string;
  type: 'todo' | 'kpi';
  status: string;
}

const Deadline = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

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
        
        // TODO 데이터 로드
        const todoData = await getTodos();

        // KPI 데이터 로드 (임시 데이터)
        const mockKpis: KpiItem[] = [
          {
            id: 1,
            title: "월간 매출 목표",
            target_value: 1000000,
            current_value: 850000,
            due_date: currentDate.format('YYYY-MM-DD'),
            status: "진행중"
          },
          {
            id: 2,
            title: "신규 고객 확보",
            target_value: 50,
            current_value: 35,
            due_date: currentDate.add(7, 'day').format('YYYY-MM-DD'),
            status: "진행중"
          }
        ];

        // 이벤트 데이터 생성
        const todoEvents: CalendarEvent[] = todoData
          .filter(todo => todo.due_date)
          .map(todo => ({
            id: todo.id,
            title: todo.title,
            date: todo.due_date!,
            type: 'todo' as const,
            status: todo.is_done ? '완료' : '진행중'
          }));

        const kpiEvents: CalendarEvent[] = mockKpis.map(kpi => ({
          id: kpi.id,
          title: kpi.title,
          date: kpi.due_date,
          type: 'kpi' as const,
          status: kpi.status
        }));

        setEvents([...todoEvents, ...kpiEvents]);
      } catch (error) {
        console.error('데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

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

  // 이벤트 타입별 색상
  const getEventColor = (type: 'todo' | 'kpi', status: string) => {
    if (type === 'todo') {
      return status === '완료' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800';
    }
    return status === '완료' ? 'bg-purple-100 text-purple-800' : 'bg-orange-100 text-orange-800';
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
        <h2 className="text-2xl font-bold mb-2">📅 KPI / TODO 마감일 연동</h2>
        <p className="text-gray-600">
          KPI 및 To-do 마감 일정을 자동으로 동기화하여 보여줍니다.
        </p>
      </div>

      {/* 캘린더 헤더 */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between p-4 border-b">
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
                      className={`text-xs p-1 rounded truncate ${getEventColor(event.type, event.status)}`}
                      title={event.title}
                    >
                      <div className="flex items-center gap-1">
                        {event.type === 'todo' ? (
                          <CheckSquare size={10} />
                        ) : (
                          <Target size={10} />
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
            <span className="text-sm">TODO 진행중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 rounded"></div>
            <span className="text-sm">TODO 완료</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-orange-100 rounded"></div>
            <span className="text-sm">KPI 진행중</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-purple-100 rounded"></div>
            <span className="text-sm">KPI 완료</span>
          </div>
        </div>
      </div>

      {/* 통계 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="text-blue-600" size={20} />
            <h4 className="font-semibold">이번 달 TODO</h4>
          </div>
          <div className="text-2xl font-bold text-blue-600">
            {events.filter(e => e.type === 'todo' && dayjs(e.date).month() === currentDate.month()).length}개
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="text-orange-600" size={20} />
            <h4 className="font-semibold">이번 달 KPI</h4>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {events.filter(e => e.type === 'kpi' && dayjs(e.date).month() === currentDate.month()).length}개
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="text-green-600" size={20} />
            <h4 className="font-semibold">오늘 마감</h4>
          </div>
          <div className="text-2xl font-bold text-green-600">
            {events.filter(e => dayjs(e.date).isSame(dayjs(), 'day')).length}개
          </div>
        </div>
      </div>
    </div>
  );
};

export default Deadline;
