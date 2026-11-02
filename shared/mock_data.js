// Gamza Shared Mock Data and Types
const INITIAL_PRODUCTS = [
  {
    id: 1,
    title: "맥북 에어 M2 13인치 미드나이트 풀박스",
    category: "디지털기기",
    price: 1050000,
    location: "강남구 역삼1동",
    timeAgo: "10분 전",
    status: "판매중", // 판매중 | 예약중 | 거래 완료
    imageUrl: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=1000&q=80",
    description: "실사용 6개월 미만 배터리 효율 98%입니다. 생활기스 거의 없고 보호필름 부착해서 사용했습니다. 박스, 정품 충전기, 케이블 모두 포함입니다. 역삼역 인근 직거래 선호합니다!",
    seller: {
      name: "포슬포슬감자",
      profileImg: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
      location: "역삼1동",
      potatoTemp: "42.5℃"
    },
    likes: 14
  },
  {
    id: 2,
    title: "말랑쫀득 왕감자 바디필로우 인형 (새상품)",
    category: "기타",
    price: 12000,
    location: "서초구 서초동",
    timeAgo: "35분 전",
    status: "판매중",
    imageUrl: "https://images.unsplash.com/photo-1584905066893-7d5c142ba4e1?auto=format&fit=crop&w=1000&q=80",
    description: "선물받았는데 집에 인형이 너무 많아서 미개봉 상태 그대로 보관 중입니다. 극세사 재질이라 완전 보들보들하고 푹신해요! 감자덕후분 얼른 데려가세요~",
    seller: {
      name: "감동란러버",
      profileImg: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
      location: "서초동",
      potatoTemp: "38.2℃"
    },
    likes: 8
  },
  {
    id: 3,
    title: "내추럴 원목 800 원형 미니 카페 테이블",
    category: "가구/인테리어",
    price: 45000,
    location: "서초구 양재2동",
    timeAgo: "2시간 전",
    status: "예약중",
    imageUrl: "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?auto=format&fit=crop&w=1000&q=80",
    description: "원룸이나 카페 분위기 내기 딱 좋은 원목 테이블입니다. 상판 코팅 잘 되어 있어 이염 없습니다. 이사 가게 되어 급처분해요. SUV나 뒷좌석 접히는 승용차로 가져가셔야 합니다.",
    seller: {
      name: "따뜻한식탁",
      profileImg: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
      location: "양재2동",
      potatoTemp: "51.0℃"
    },
    likes: 23
  },
  {
    id: 4,
    title: "파타고니아 클래식 레트로-X 후리스 자켓 M",
    category: "의류",
    price: 130000,
    location: "서초구 반포동",
    timeAgo: "3시간 전",
    status: "판매중",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80",
    description: "정품 매장에서 구매한 파타고니아 레트로X 내추럴 컬러입니다. 털 뭉침 거의 없고 드라이클리닝 완료된 상태입니다. 실측 사이즈 문의 주시면 답변 드릴게요.",
    seller: {
      name: "빈티지구황작물",
      profileImg: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
      location: "반포동",
      potatoTemp: "36.5℃"
    },
    likes: 19
  },
  {
    id: 5,
    title: "드롱기 전자동 에스프레소 커피머신 마그니피카S",
    category: "생활가전",
    price: 250000,
    location: "서초구 방배동",
    timeAgo: "5시간 전",
    status: "거래 완료",
    imageUrl: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?auto=format&fit=crop&w=1000&q=80",
    description: "1년 정도 주말에만 간간이 사용했던 커피머신입니다. 내부 석회제거 세척 완료했고 스팀 노즐 정상 작동합니다. 좋은 분께 양도되었습니다. 감사합니다!",
    seller: {
      name: "홈카페마스터",
      profileImg: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      location: "방배동",
      potatoTemp: "62.4℃"
    },
    likes: 31
  },
  {
    id: 6,
    title: "뮤지컬 베르사유의 장미 R석 1층 중앙 연석 2매",
    category: "도서/티켓",
    price: 160000,
    location: "강남구 삼성동",
    timeAgo: "어제",
    status: "판매중",
    imageUrl: "https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1000&q=80",
    description: "개인 사정으로 아쉽게 못 가게 되어 정가 이하로 양도합니다. 현장 수령 또는 모바일 티켓 정보 즉시 전달 가능합니다. 쿨거래 시 약간의 네고 가능해요.",
    seller: {
      name: "문화생활감자",
      profileImg: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
      location: "삼성동",
      potatoTemp: "48.9℃"
    },
    likes: 5
  },
  {
    id: 7,
    title: "폭신폭신 감자모양 댕댕이 노즈워크 장난감 & 마약방석 세트",
    category: "반려동물 용품",
    price: 18000,
    location: "강남구 역삼1동",
    timeAgo: "방금 전",
    status: "판매중",
    imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1dc0?auto=format&fit=crop&w=1000&q=80",
    description: "새상품 미개봉입니다! 감자 모양의 귀여운 노즈워크 장난감과 극세사 푹신 방석 세트예요. 우리 집 댕댕이 주려고 샀는데 같은 게 두 개 생겨서 저렴하게 나눔/판매합니다. 역삼역 직거래 가능합니다 🐾",
    seller: {
      name: "댕댕이포슬이",
      profileImg: "https://images.unsplash.com/photo-1543610892-0b1f7e6d8ac1?auto=format&fit=crop&w=200&q=80",
      location: "역삼1동",
      potatoTemp: "39.0℃"
    },
    likes: 12
  }
];

const CATEGORIES = [
  "전체",
  "디지털기기",
  "가구/인테리어",
  "의류",
  "생활가전",
  "도서/티켓",
  "반려동물 용품",
  "기타"
];

const STATUS_TYPES = ["판매중", "예약중", "거래 완료"];

// Export for module or global use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { INITIAL_PRODUCTS, CATEGORIES, STATUS_TYPES };
}
