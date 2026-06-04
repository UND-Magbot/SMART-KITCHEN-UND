import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Droplet,
  Flame,
  Minus,
  MonitorCog,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  ShoppingCart,
  Smartphone,
  TabletSmartphone,
  Trash2,
  Utensils,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import KitchenHmi from "./kitchen/KitchenHmi";
import { placeOrder as placeKitchenOrder } from "./kitchen/useKitchenSystem";

const surfaces = [
  { id: "customer", label: "고객 태블릿", description: "테이블에서 바로 터치해 주문하는 고객용 화면", icon: TabletSmartphone },
  { id: "kitchen", label: "주방 HMI", description: "주방 공정과 장비 상태를 조작하는 화면", icon: MonitorCog },
  { id: "owner", label: "운영 관제", description: "전 오토웍·주문·큐·재고·매출을 통합 모니터링하고 주문·결제(POS)를 관리하는 매장 관제 화면", icon: Smartphone },
];

const generalCategories = [
  { id: "noodle", labels: { ko: "식사", en: "Noodles & Rice", zh: "饭面" } },
  { id: "cold", labels: { ko: "냉채", en: "Chilled", zh: "冷菜" } },
  { id: "premium", labels: { ko: "프리미엄", en: "Premium", zh: "高级菜" } },
  { id: "new", labels: { ko: "신메뉴", en: "New Menu", zh: "新菜" } },
  { id: "fried", labels: { ko: "튀김 / 볶음", en: "Fried / Wok", zh: "炸 / 炒" } },
  { id: "side-drink", labels: { ko: "사이드 / 주류", en: "Sides / Drinks", zh: "小菜 / 酒水" } },
];

const courseCategories = [{ id: "course", labels: { ko: "코스 메뉴", en: "Course Menu", zh: "套餐" } }];

const allCategories = [...generalCategories, ...courseCategories];

const languageLabels = {
  ko: {
    welcome: "환영합니다",
    help: "도움말 ?",
    add: "+ 담기",
    allergy: "알레르기 정보는 메뉴 카드 우측 상단",
    cart: "담은 메뉴",
    courseHint: "코스 카드를 터치해 구성과 설명을 확인한 뒤 주문하세요.",
    currentWait: "현재 매장 평균 대기시간",
    waitValue: "약 7분",
    waitBase: "(14:23 기준)",
    detail: "상세 보기",
    emptyCart: "담긴 메뉴가 없습니다.",
    footerHelp: "도움이 필요하시면 직원 호출을 눌러주세요.",
    memo: "요청사항",
    memoPlaceholder: "예: 양파는 빼주세요",
    menuHint: "원하는 메뉴 카드를 터치하거나 + 담기를 눌러 바로 추가하세요.",
    myOrder: "주문내역",
    next: "결제로 이동",
    noMenus: "이 카테고리에는 준비된 메뉴가 없습니다.",
    optionAdd: "선택 옵션 담기",
    selectedMenu: "선택 메뉴",
    selectedBadge: "선택됨",
    landingTitle: "테이블에서 바로 주문하세요",
    landingSubtitle: "메뉴 선택, 옵션/수량 확인, 주문 완료까지 직원 호출 없이 진행할 수 있습니다.",
    landingNote: "결제는 식사 후 카운터/POS에서 처리됩니다.",
    startOrder: "주문 시작",
    tableNo: "테이블 7",
    staff: "직원 호출",
    water: "물",
    sideDish: "반찬",
    countSuffix: "건",
    perPerson: "1인",
    unit: "원",
    pricePerUnit: "1개",
    minPeopleSuffix: "인 이상",
    qtyDown: "수량 줄이기",
    qtyUp: "수량 늘리기",
    removeItem: "삭제",
    clearAll: "전체 삭제",
    totalCount: "총",
    spice: "맵기",
    size: "사이즈",
    set: "구성",
    qty: "수량",
    spiceOptions: ["순하게", "보통", "맵게"],
    sizeOptions: ["일반", "곱배기"],
    setOptions: ["단품", "세트"],
    quickMemos: ["양파 빼기", "덜 맵게", "소스 따로"],
    aiRecommend: "AI 추천",
    aiRecommendTitle: "군만두 추가하면 사이드 -10%",
    aiRecommendModalLead: "함께 주문하면 더 좋아요",
    aiRecommendModalReason: "지금 담긴 메뉴와 가장 잘 어울리고, 자리에서 가장 많이 함께 주문되는 사이드입니다. 추가 시 사이드 메뉴 10% 할인이 자동 적용됩니다.",
    aiRecommendModalBenefit: "사이드 -10% 자동 할인",
    aiRecommendCancel: "다음에",
    cancel: "취소",
    addToCartCta: "담기",
    payNow: "결제하기",
    orderNow: "주문하기",
    modePrepaid: "선불",
    modePostpaid: "후불",
    modeLabel: "결제 방식",
    cartSpiceLabel: "맵기",
    cartSizeLabel: "사이즈",
    cartMemoLabel: "요청",
    orderHistory: "주문내역",
    waitingTeams: "현재 대기",
    waitingTeamsValue: "10팀",
    mobileOrderTitle: "QR로\n메뉴 주문",
    mobileOrderDescription: "휴대폰 카메라로 QR을 스캔하면 자리에서 바로 주문할 수 있어요.",
    mobileOrderHint: "스캔이 안 되면 직원을 호출해주세요.",
    close: "닫기",
    coursePanelHeader: "코스 진행 상황",
    courseNowLabel: "지금",
    courseNextLabel: "다음",
    courseEatingNow: "드시는 중",
    courseAllStepsLabel: "전체 흐름",
    courseNextEta: "약 8분 후 서빙",
    courseStepDone: "제공 완료",
    courseStepQueued: "예정",
    courseStepPreparing: "준비 중",
    courseTimingTitle: "다음 요리 타이밍",
    courseTimingIdle: "현재 요리를 거의 다 드셨을 때 요청하면 주방에서 다음 요리를 준비합니다.",
    courseTimingPreparing: "주방에서 다음 요리를 따뜻하게 맞춰 준비 중입니다.",
    coursePrepEstimateLabel: "예상 조리·서빙",
    courseRequestAtLabel: "요청 시각",
    courseMinuteUnit: "분",
    courseArrivalConfirm: "다음 요리 도착 확인",
    courseRequestNext: "다음 요리 요청",
    courseRequestSent: "주방에 전달됨",
    courseEnd: "코스 종료",
    courseProgressOf: "단계",
    aiAdd: "+ 추가",
    subtotal: "소계",
    discount: "할인",
    total: "총 주문 금액",
    courseOrderHint: "코스 메뉴는 중앙 카드에서 상세 구성을 확인한 뒤 장바구니에 담아주세요.",
    orderCode: "주문번호",
    orderAccepted: "주문이 접수되었습니다.",
    orderProgress: "주방에서 주문을 확인하고 있습니다. 진행 상태는 이 화면에서 확인할 수 있습니다.",
    statusOrdered: "주문 완료",
    statusCooking: "조리중",
    statusServing: "서빙중",
    modalClose: "닫기",
    courseAddBtn: "코스 담기",
    courseAddPersonsSuffix: "인 기준",
    validateOptions: "맵기와 사이즈를 선택해주세요.",
    validateEmptyCart: "장바구니에 메뉴를 먼저 담아주세요.",
    serviceNoticeSuffix: "요청이 접수되었습니다.",
    courseDetailLabel: "코스 상세",
    courseOrderable: "인 이상 주문 가능",
    stepperLabels: ["메뉴 선택", "옵션 / 수량", "결제", "완료"],
    orderTitle: "주문 완료!",
    orderSubtitle: "조리가 시작되었어요. 잠시만 기다려 주세요.",
    orderNumber: "주문 번호",
    estimatedTime: "예상 시간",
    waitBaseShort: "현재 매장 평균 대기 기준",
    progressLabel: "진행 상태",
    progressSteps: ["접수", "대기", "조리", "완성"],
    paymentAmount: "결제 금액",
    paymentAmountAccumulated: "테이블 누적",
    printReceipt: "주문 수정 요청",
    smsAlert: "상태 문자 알림",
    newOrder: "추가 주문",
    thanksMessage: "즐거운 식사 되세요",
    reviewTitle: "주문 확인",
    reviewHint: "이 내용으로 결제됩니다. 마지막으로 확인해주세요.",
    reviewItemsTitle: "주문 상품",
    reviewCourseItems: "코스 구성",
    confirmOrder: "결제 완료",
    editOrder: "이전",
    orderRequesting: "결제 단계",
    statusAdvance: "다음 상태로",
    courseProgressTitle: "코스 진행 상황",
    currentCourse: "현재 코스",
    nextCourse: "다음 코스",
    courseProgressPercent: "코스 진행률",
    posTitle: "POS 결제 연동",
    posStatusReady: "POS 전표 생성 완료",
    posStatusWaiting: "식사 후 카운터 결제 대기",
    posReceipt: "POS 전표",
    posInstruction: "주문 내역과 누적 금액이 POS에 전달되었습니다. 식사 후 카운터에서 결제해주세요.",
    posSyncAction: "POS 동기화 확인",
    posTableTotal: "POS 전달 금액",
    paymentTitle: "결제 수단을 선택해주세요",
    paymentHint: "선택 후 결제 완료를 누르면 POS 전표와 주방 주문이 함께 생성됩니다.",
    paymentMethod: "결제 수단",
    paymentMethods: ["신용 / 체크카드", "간편 결제 통합", "카카오페이", "네이버페이", "토스페이", "현금 / 상품권"],
    paymentMethodNotes: ["단말기 삽입 결제", "QR / NFC 인식", "카카오톡 알림 인증", "네이버 앱 인증", "토스 앱 인증", "직원 확인 후 결제"],
    paymentAgreement: "결제 진행 동의",
    paymentAgreeAll: "전체 동의",
    paymentAgreeHint: "필수 동의 항목을 확인해주세요.",
    required: "필수",
    optional: "선택",
    paymentPrivacy: "개인정보 이용 동의",
    paymentTerms: "결제대행 약관 동의",
    paymentMarketing: "마케팅 정보 수신 동의",
    paymentSummary: "주문 요약",
    paymentPay: "결제 완료",
    paymentSelected: "선택됨",
    receiptInfo: "결제 정보",
    servingMethod: "수령 방식",
    servingTable: "매장 식사 · 테이블 7번",
    callNotice: "호출 알림",
    callNoticeValue: "주문번호 호출 시 팝업",
  },
  en: {
    welcome: "Welcome",
    help: "Help ?",
    add: "+ Add",
    allergy: "Allergy info is on the top-right of each menu card.",
    cart: "Added items",
    courseHint: "Touch a course card to review the full sequence before ordering.",
    currentWait: "Average wait time",
    waitValue: "About 7 min",
    waitBase: "(as of 14:23)",
    detail: "Details",
    emptyCart: "No items in cart.",
    footerHelp: "Tap staff call if you need help.",
    memo: "Request",
    memoPlaceholder: "Ex: no onion",
    menuHint: "Touch a menu card or tap + Add to place it in your cart.",
    myOrder: "Order List",
    next: "Go to Payment",
    noMenus: "No menus are prepared in this category.",
    optionAdd: "Add selected options",
    selectedMenu: "Selected menu",
    selectedBadge: "Selected",
    landingTitle: "Order at your table",
    landingSubtitle: "Choose menus, confirm options and quantities, then send the order without waiting for staff.",
    landingNote: "Payment is handled at the counter/POS after the meal.",
    startOrder: "Start Order",
    tableNo: "Table 7",
    staff: "Staff Call",
    water: "Water",
    sideDish: "Side Dish",
    countSuffix: " items",
    perPerson: "per person",
    unit: " KRW",
    pricePerUnit: "each",
    minPeopleSuffix: "+ guests",
    qtyDown: "Decrease quantity",
    qtyUp: "Increase quantity",
    removeItem: "Remove",
    clearAll: "Clear all",
    totalCount: "Total",
    spice: "Spice",
    size: "Size",
    set: "Combo",
    qty: "Qty",
    spiceOptions: ["Mild", "Normal", "Spicy"],
    sizeOptions: ["Regular", "Large"],
    setOptions: ["Single", "Set"],
    quickMemos: ["No onion", "Less spicy", "Sauce on side"],
    aiRecommend: "AI Pick",
    aiRecommendTitle: "Add fried dumplings: 10% off sides",
    aiRecommendModalLead: "Goes great with your order",
    aiRecommendModalReason: "Most-ordered side that pairs with the items in your cart. Adding it triggers an automatic 10% side discount.",
    aiRecommendModalBenefit: "Sides -10% applied automatically",
    aiRecommendCancel: "Maybe later",
    cancel: "Cancel",
    addToCartCta: "Add",
    payNow: "Pay Now",
    orderNow: "Place Order",
    modePrepaid: "Prepaid",
    modePostpaid: "Postpaid",
    modeLabel: "Payment Mode",
    cartSpiceLabel: "Spice",
    cartSizeLabel: "Size",
    cartMemoLabel: "Note",
    orderHistory: "Orders",
    waitingTeams: "Waiting now",
    waitingTeamsValue: "10 teams",
    mobileOrderTitle: "Scan QR\nto order",
    mobileOrderDescription: "Scan the QR with your phone camera to order right from your seat.",
    mobileOrderHint: "Tap the staff call if scanning doesn't work.",
    close: "Close",
    coursePanelHeader: "Course progress",
    courseNowLabel: "Now",
    courseNextLabel: "Next",
    courseEatingNow: "Enjoy your meal",
    courseAllStepsLabel: "Full sequence",
    courseNextEta: "About 8 min away",
    courseStepDone: "Served",
    courseStepQueued: "Scheduled",
    courseStepPreparing: "Preparing",
    courseTimingTitle: "Next dish timing",
    courseTimingIdle: "Request the next dish when you are almost finished, and the kitchen will start preparing it.",
    courseTimingPreparing: "The kitchen is preparing the next dish so it arrives warm.",
    coursePrepEstimateLabel: "Cook & serve estimate",
    courseRequestAtLabel: "Requested at",
    courseMinuteUnit: " min",
    courseArrivalConfirm: "Confirm dish arrived",
    courseRequestNext: "Request next course",
    courseRequestSent: "Sent to kitchen",
    courseEnd: "Course finished",
    courseProgressOf: "of",
    aiAdd: "+ Add",
    subtotal: "Subtotal",
    discount: "Discount",
    total: "Order Total",
    courseOrderHint: "For course menus, please review the details on the center card before adding to cart.",
    orderCode: "Order No.",
    orderAccepted: "Your order has been received.",
    orderProgress: "The kitchen is reviewing your order. You can track its progress on this screen.",
    statusOrdered: "Ordered",
    statusCooking: "Cooking",
    statusServing: "Serving",
    modalClose: "Close",
    courseAddBtn: "Add Course",
    courseAddPersonsSuffix: " guests basis",
    validateOptions: "Please select spice and size.",
    validateEmptyCart: "Please add items to the cart first.",
    serviceNoticeSuffix: "request has been received.",
    courseDetailLabel: "Course Detail",
    courseOrderable: "+ guests required",
    stepperLabels: ["Select Menu", "Options / Qty", "Payment", "Done"],
    orderTitle: "Order placed!",
    orderSubtitle: "We're preparing your meal. Hang tight.",
    orderNumber: "Order Number",
    estimatedTime: "ETA",
    waitBaseShort: "Based on current average wait",
    progressLabel: "Progress",
    progressSteps: ["Received", "Queued", "Cooking", "Ready"],
    paymentAmount: "Paid",
    paymentAmountAccumulated: "Table total",
    printReceipt: "Request Change",
    smsAlert: "SMS Alert",
    newOrder: "Add Order",
    thanksMessage: "Enjoy your meal",
    reviewTitle: "Order Review",
    reviewHint: "This will be charged. Please review one last time.",
    reviewItemsTitle: "Order Items",
    reviewCourseItems: "Course sequence",
    confirmOrder: "Complete Payment",
    editOrder: "Back",
    orderRequesting: "Payment",
    statusAdvance: "Next Status",
    courseProgressTitle: "Course Progress",
    currentCourse: "Current Course",
    nextCourse: "Next Course",
    courseProgressPercent: "Course Progress",
    posTitle: "POS Payment Sync",
    posStatusReady: "POS ticket created",
    posStatusWaiting: "Pay at counter after meal",
    posReceipt: "POS Ticket",
    posInstruction: "Order details and table total were sent to POS. Please pay at the counter after the meal.",
    posSyncAction: "Check POS Sync",
    posTableTotal: "POS Amount",
    paymentTitle: "Select payment method",
    paymentHint: "After payment, POS ticket and kitchen order are created together.",
    paymentMethod: "Payment Method",
    paymentMethods: ["Credit / Debit Card", "Easy Pay Hub", "KakaoPay", "Naver Pay", "Toss Pay", "Cash / Voucher"],
    paymentMethodNotes: ["Terminal card payment", "QR / NFC scan", "KakaoTalk confirmation", "Naver app confirmation", "Toss app confirmation", "Staff confirmation"],
    paymentAgreement: "Payment consent",
    paymentAgreeAll: "Agree to all",
    paymentAgreeHint: "Please accept the required terms.",
    required: "Required",
    optional: "Optional",
    paymentPrivacy: "Personal data consent",
    paymentTerms: "Payment terms consent",
    paymentMarketing: "Marketing consent",
    paymentSummary: "Order Summary",
    paymentPay: "Complete Payment",
    paymentSelected: "Selected",
    receiptInfo: "Payment Info",
    servingMethod: "Serving",
    servingTable: "Dine-in · Table 7",
    callNotice: "Call Notice",
    callNoticeValue: "Popup when order number is called",
  },
  zh: {
    welcome: "欢迎光临",
    help: "帮助 ?",
    add: "+ 加入",
    allergy: "过敏信息位于菜单卡右上方。",
    cart: "已选商品",
    courseHint: "点击套餐卡查看详细构成后点餐。",
    currentWait: "当前平均等待时间",
    waitValue: "约 7 分钟",
    waitBase: "(截至 14:23)",
    detail: "查看详情",
    emptyCart: "购物车为空。",
    footerHelp: "需要帮助时请点击呼叫服务员。",
    memo: "备注",
    memoPlaceholder: "例：不要洋葱",
    menuHint: "点击菜单卡或 + 加入即可添加。",
    myOrder: "订单明细",
    next: "去支付",
    noMenus: "此分类暂无菜单。",
    optionAdd: "加入所选选项",
    selectedMenu: "已选菜单",
    selectedBadge: "已选择",
    landingTitle: "在座位上直接点餐",
    landingSubtitle: "选择菜单、确认选项和数量，然后提交订单。",
    landingNote: "用餐后在柜台/POS结账。",
    startOrder: "开始点餐",
    tableNo: "7号桌",
    staff: "呼叫服务员",
    water: "水",
    sideDish: "小菜",
    countSuffix: "项",
    perPerson: "每位",
    unit: " 韩元",
    pricePerUnit: "每份",
    minPeopleSuffix: "位以上",
    qtyDown: "减少数量",
    qtyUp: "增加数量",
    removeItem: "删除",
    clearAll: "全部删除",
    totalCount: "共",
    spice: "辣度",
    size: "份量",
    set: "搭配",
    qty: "数量",
    spiceOptions: ["微辣", "适中", "重辣"],
    sizeOptions: ["普通", "大份"],
    setOptions: ["单点", "套餐"],
    quickMemos: ["不要洋葱", "少辣", "酱料另放"],
    aiRecommend: "AI 推荐",
    aiRecommendTitle: "加点煎饺，配菜享 9 折",
    aiRecommendModalLead: "搭配最合适",
    aiRecommendModalReason: "与购物车中的菜品最常一起点的小吃。加入后自动享受配菜 9 折优惠。",
    aiRecommendModalBenefit: "自动应用配菜 9 折",
    aiRecommendCancel: "下次再说",
    cancel: "取消",
    addToCartCta: "加入购物车",
    payNow: "去支付",
    orderNow: "下单",
    modePrepaid: "先付",
    modePostpaid: "后付",
    modeLabel: "支付方式",
    cartSpiceLabel: "辣度",
    cartSizeLabel: "份量",
    cartMemoLabel: "备注",
    orderHistory: "订单",
    waitingTeams: "当前等待",
    waitingTeamsValue: "10 桌",
    mobileOrderTitle: "扫码\n点餐",
    mobileOrderDescription: "用手机相机扫描二维码，在座位上直接下单。",
    mobileOrderHint: "无法扫描时，请呼叫服务员。",
    close: "关闭",
    coursePanelHeader: "套餐进度",
    courseNowLabel: "当前",
    courseNextLabel: "下一道",
    courseEatingNow: "请慢用",
    courseAllStepsLabel: "全部流程",
    courseNextEta: "约 8 分钟后上菜",
    courseStepDone: "已上菜",
    courseStepQueued: "待上菜",
    courseStepPreparing: "准备中",
    courseTimingTitle: "下一道时间",
    courseTimingIdle: "快吃完当前菜品时点击请求，厨房会开始准备下一道。",
    courseTimingPreparing: "厨房正在准备下一道菜，尽量热乎上桌。",
    coursePrepEstimateLabel: "预计制作上菜",
    courseRequestAtLabel: "请求时间",
    courseMinuteUnit: "分钟",
    courseArrivalConfirm: "确认已上菜",
    courseRequestNext: "请求下一道菜",
    courseRequestSent: "已通知厨房",
    courseEnd: "套餐结束",
    courseProgressOf: "/",
    aiAdd: "+ 添加",
    subtotal: "小计",
    discount: "折扣",
    total: "订单合计",
    courseOrderHint: "套餐请先点击中央卡片查看详情后再加入购物车。",
    orderCode: "订单号",
    orderAccepted: "订单已受理。",
    orderProgress: "厨房正在确认订单，您可在此画面查看进度。",
    statusOrdered: "已下单",
    statusCooking: "烹饪中",
    statusServing: "上菜中",
    modalClose: "关闭",
    courseAddBtn: "加入套餐",
    courseAddPersonsSuffix: "位起",
    validateOptions: "请选择辣度与份量。",
    validateEmptyCart: "请先将菜品加入购物车。",
    serviceNoticeSuffix: "请求已受理。",
    courseDetailLabel: "套餐详情",
    courseOrderable: "位以上可预订",
    stepperLabels: ["选择菜单", "选项 / 数量", "支付", "完成"],
    orderTitle: "下单成功!",
    orderSubtitle: "正在准备您的餐点,请稍候。",
    orderNumber: "订单号",
    estimatedTime: "预计时间",
    waitBaseShort: "基于当前门店平均等待",
    progressLabel: "进度",
    progressSteps: ["受理", "等待", "烹饪", "完成"],
    paymentAmount: "支付金额",
    paymentAmountAccumulated: "本桌累计",
    printReceipt: "申请修改订单",
    smsAlert: "短信通知",
    newOrder: "继续点餐",
    thanksMessage: "用餐愉快",
    reviewTitle: "确认订单",
    reviewHint: "将按此内容支付。请再次确认。",
    reviewItemsTitle: "订单商品",
    reviewCourseItems: "套餐构成",
    confirmOrder: "完成支付",
    editOrder: "返回",
    orderRequesting: "支付中",
    statusAdvance: "下一状态",
    courseProgressTitle: "套餐进度",
    currentCourse: "当前菜品",
    nextCourse: "下一菜品",
    courseProgressPercent: "套餐进度",
    posTitle: "POS 支付同步",
    posStatusReady: "POS 单据已生成",
    posStatusWaiting: "餐后柜台结账",
    posReceipt: "POS 单据",
    posInstruction: "订单与本桌累计金额已同步至 POS，请用餐后到柜台结账。",
    posSyncAction: "检查 POS 同步",
    posTableTotal: "POS 金额",
    paymentTitle: "请选择支付方式",
    paymentHint: "支付完成后会同时生成 POS 单据和厨房订单。",
    paymentMethod: "支付方式",
    paymentMethods: ["信用 / 借记卡", "综合快捷支付", "KakaoPay", "Naver Pay", "Toss Pay", "现金 / 礼券"],
    paymentMethodNotes: ["刷卡终端支付", "QR / NFC 识别", "KakaoTalk 认证", "Naver 应用认证", "Toss 应用认证", "服务员确认"],
    paymentAgreement: "支付同意",
    paymentAgreeAll: "全部同意",
    paymentAgreeHint: "请勾选必需的同意项。",
    required: "必需",
    optional: "可选",
    paymentPrivacy: "个人信息使用同意",
    paymentTerms: "支付服务条款同意",
    paymentMarketing: "营销信息接收同意",
    paymentSummary: "订单摘要",
    paymentPay: "完成支付",
    paymentSelected: "已选择",
    receiptInfo: "支付信息",
    servingMethod: "取餐方式",
    servingTable: "堂食 · 7号桌",
    callNotice: "叫号提醒",
    callNoticeValue: "叫到订单号时弹窗",
  },
};

const menuItems = [
  {
    id: "la-galbi-jjamppong",
    names: { ko: "시후 LA 갈비 짬뽕", en: "LA Galbi Jjamppong", zh: "LA排骨辣汤面" },
    romanized: "Spicy seafood noodle soup with grilled LA ribs",
    category: "noodle",
    price: 30000,
    tag: "신메뉴",
    notes: { ko: "불향 가득한 LA 갈비와 해산물 육수의 조화", en: "Grilled LA ribs with spicy seafood broth", zh: "LA排骨与海鲜汤底的组合" },
    rating: "4.9",
    image: "/food/jjamppong-noodle.png",
  },
  {
    id: "abalone-jjamppong",
    names: { ko: "시후 활전복 짬뽕", en: "Abalone Jjamppong", zh: "鲍鱼辣汤面" },
    romanized: "Spicy seafood noodle soup with fresh abalone",
    category: "noodle",
    price: 23000,
    tag: "인기",
    notes: { ko: "전복과 진한 해산물 육수의 프리미엄 짬뽕", en: "Premium spicy noodle soup with abalone", zh: "鲜鲍鱼海鲜辣汤面" },
    rating: "4.8",
    image: "/food/jjamppong-noodle.png",
  },
  {
    id: "mongolian-noodle",
    names: { ko: "몽골리안 누들", en: "Mongolian Noodles", zh: "蒙古炒面" },
    romanized: "Stir-fried meat and vegetables with Mongolian sauce",
    category: "noodle",
    price: 18000,
    tag: "추천",
    notes: { ko: "부드러운 고기와 야채를 몽골리안 소스로 볶아낸 요리", en: "Stir-fried noodles with meat, vegetables, and sauce", zh: "肉与蔬菜炒面" },
    rating: "4.6",
    image: "/food/wok-noodle.png",
  },
  {
    id: "yuni-jjajang",
    names: { ko: "유니 짜장면", en: "Yuni Jjajangmyeon", zh: "肉末炸酱面" },
    romanized: "Minced meat jjajangmyeon",
    category: "noodle",
    price: 15000,
    tag: "기본",
    notes: { ko: "잘게 다진 고기를 춘장에 볶아낸 진한 짜장면", en: "Black bean noodles with minced meat", zh: "肉末炸酱面" },
    rating: "4.7",
    image: "/food/uni-jjajang.png",
  },
  {
    id: "premium-cold",
    names: { ko: "시후 프리미엄 냉채", en: "Premium Cold Combination", zh: "西湖精品冷拼" },
    romanized: "XI HU Premium Cold Combination",
    category: "cold",
    price: 120000,
    tag: "프리미엄",
    notes: { ko: "최상 식재료와 냉장의 기술이 만난 프리미엄 냉채", en: "Premium chilled starter with top-grade ingredients", zh: "高端冷菜拼盘" },
    rating: "4.9",
    image: "/food/lunch-set.png",
  },
  {
    id: "special-cold",
    names: { ko: "시후 특선 냉채", en: "Special Cold Combination", zh: "西湖特制冷拼" },
    romanized: "XI HU Special Cold Combination",
    category: "cold",
    price: 80000,
    tag: "추천",
    notes: { ko: "화려한 식감의 특선 냉채", en: "Signature chilled combination starter", zh: "特制冷菜" },
    rating: "4.7",
    image: "/food/lunch-set.png",
  },
  {
    id: "double-skin",
    names: { ko: "양장피", en: "Double Skin Seafood Salad", zh: "两张皮" },
    romanized: "Double skin seafood salad",
    category: "cold",
    price: 55000,
    tag: "인기",
    notes: { ko: "해산물과 채소를 겨자 소스에 버무린 다채로운 요리", en: "Seafood and vegetables with mustard sauce", zh: "海鲜蔬菜芥末冷菜" },
    rating: "4.6",
    image: "/food/chili-shrimp.png",
  },
  {
    id: "braised-shark-fin",
    names: { ko: "호황복국수", en: "Braised Superior Shark's Fin", zh: "好皇福禄薰" },
    romanized: "Braised superior shark's fin",
    category: "premium",
    price: 150000,
    tag: "시그니처",
    notes: { ko: "시후의 품격을 상징하는 최고급 특수 요리", en: "Premium signature dish for special occasions", zh: "高级宴席料理" },
    rating: "4.9",
    image: "/food/lunch-set.png",
  },
  {
    id: "lobster-tail",
    names: { ko: "차이나타운 랍스터 테일 볶음", en: "Stir-fried Lobster Tail", zh: "唐人街炒龙虾尾" },
    romanized: "Chinatown stir-fried lobster tail",
    category: "premium",
    price: 130000,
    tag: "시그니처",
    notes: { ko: "특제 소스로 입힌 풍성한 랍스터 요리", en: "Rich lobster tail with signature sauce", zh: "招牌龙虾尾" },
    rating: "4.8",
    image: "/food/chili-shrimp.png",
  },
  {
    id: "mala-beef",
    names: { ko: "마라우육", en: "Mala Beef", zh: "麻辣牛肉" },
    romanized: "Mala beef",
    category: "premium",
    price: 70000,
    tag: "매운맛",
    notes: { ko: "마라의 향과 부드러운 소고기의 조화", en: "Tender beef with aromatic mala spice", zh: "麻辣牛肉" },
    rating: "4.7",
    image: "/food/spicy-rice.png",
  },
  {
    id: "crispy-ribs",
    names: { ko: "크리스피 깐풍 립", en: "Crispy Kkanpung Pork Ribs", zh: "干烹排骨" },
    romanized: "Crispy kkanpung pork ribs",
    category: "new",
    price: 55000,
    tag: "2026 신메뉴",
    notes: { ko: "튀김 옷과 부드러운 갈빗살의 대비", en: "Crispy coating with tender pork ribs", zh: "外酥里嫩排骨" },
    rating: "4.8",
    image: "/food/chili-shrimp.png",
  },
  {
    id: "fish-paprika",
    names: { ko: "어향 파프리카", en: "Fish-fragrant Paprika", zh: "鱼香彩椒" },
    romanized: "Fish-fragrant paprika",
    category: "new",
    price: 50000,
    tag: "신메뉴",
    notes: { ko: "소스의 산미와 감칠맛이 쌓인 깊은 풍미", en: "Deep flavor with fish-fragrant sauce", zh: "鱼香风味彩椒" },
    rating: "4.6",
    image: "/food/spicy-rice.png",
  },
  {
    id: "golden-butter-shrimp",
    names: { ko: "골든버터 쉬림프 스틱", en: "Golden Butter Shrimp Sticks", zh: "黄金黄油虾棒" },
    romanized: "Golden butter shrimp sticks",
    category: "fried",
    price: 45000,
    tag: "신메뉴",
    notes: { ko: "새우살 스틱과 황금빛 버터 소스의 조화", en: "Shrimp sticks with rich golden butter sauce", zh: "黄油虾棒" },
    rating: "4.7",
    image: "/food/chili-shrimp.png",
  },
  {
    id: "dumpling",
    names: { ko: "군만두", en: "Fried Dumplings", zh: "煎饺" },
    romanized: "Fried dumpling",
    category: "side-drink",
    price: 5000,
    tag: "사이드",
    notes: { ko: "바삭하게 구운 인기 사이드", en: "Crispy pan-fried dumplings", zh: "香脆煎饺" },
    rating: "4.6",
    image: "/food/dumpling.png",
  },
  {
    id: "yantai-premium",
    names: { ko: "연태 프리미엄 500ml", en: "Yantai Premium 500ml", zh: "烟台高级 500ml" },
    romanized: "Yantai premium",
    category: "side-drink",
    price: 80000,
    tag: "주류",
    notes: { ko: "중식 코스와 잘 맞는 대표 중국 주류", en: "Chinese liquor paired with premium courses", zh: "适合中餐套餐的中国酒" },
    rating: "4.5",
    image: "/food/soda.png",
  },
];

const courseMenus = [
  {
    id: "xihu-premium-course",
    names: { ko: "시후 프리미엄 코스", en: "XI HU Premium Course", zh: "西湖高级套餐" },
    romanized: "XI HU Premium Course",
    category: "course",
    price: 150000,
    tag: "코스",
    minPeople: 2,
    image: "/food/lunch-set.png",
    notes: {
      ko: "시후의 대표 요리를 순서대로 경험하는 1인 기준 코스",
      en: "A per-person course featuring XI HU's signature dishes",
      zh: "按位点餐的西湖招牌套餐",
    },
    courses: {
      ko: [
        "시후 프리미엄 냉채",
        "호황복국수(통 삭스핀)",
        "홍소 전복",
        "금사오룡",
        "통후추 아스파라거스 안심 스테이크",
        "차이나타운 랍스터 테일 볶음",
        "LA 갈비구이",
        "식사(짜장면 / 짬뽕)",
        "디저트",
      ],
      en: [
        "XI HU Premium Cold Combination",
        "Braised Superior Shark's Fin",
        "Braised Abalone",
        "Geumsaorong",
        "Peppered Asparagus Tenderloin Steak",
        "Chinatown Stir-fried Lobster Tail",
        "Grilled LA Ribs",
        "Meal (Jjajang / Jjamppong)",
        "Dessert",
      ],
      zh: [
        "西湖精品冷拼",
        "好皇福禄薰（整鱼翅）",
        "红烧鲍鱼",
        "金沙乌龙",
        "黑胡椒芦笋牛柳",
        "唐人街炒龙虾尾",
        "烤LA排骨",
        "主食（炸酱面 / 辣汤面）",
        "甜点",
      ],
    },
    detail: {
      ko: "2인 이상 예약 시 주문 가능한 프리미엄 코스입니다. 냉채부터 식사와 디저트까지 한 흐름으로 제공됩니다.",
      en: "Premium course available for parties of 2 or more, served as a full sequence from chilled starter to meal and dessert.",
      zh: "2位以上预订即可点餐的高级套餐，从冷菜到主食与甜点一气呵成。",
    },
  },
  {
    id: "xihu-signature-course",
    names: { ko: "시후 시그니처 코스", en: "XI HU Signature Course", zh: "西湖招牌套餐" },
    romanized: "XI HU Signature Course",
    category: "course",
    price: 120000,
    tag: "시그니처",
    minPeople: 2,
    image: "/food/lunch-set.png",
    notes: {
      ko: "냉채, 해산물, 육류, 식사를 균형 있게 구성한 대표 코스",
      en: "Balanced signature course with chilled dishes, seafood, meat, and meal",
      zh: "冷菜、海鲜、肉类、主食均衡搭配",
    },
    courses: {
      ko: ["시후 특선 냉채", "양장피", "홍소 전복", "크리스피 깐풍 립", "마라우육", "식사(짜장면 / 짬뽕)", "디저트"],
      en: [
        "XI HU Special Cold Combination",
        "Double Skin Seafood Salad",
        "Braised Abalone",
        "Crispy Kkanpung Pork Ribs",
        "Mala Beef",
        "Meal (Jjajang / Jjamppong)",
        "Dessert",
      ],
      zh: ["西湖特制冷拼", "两张皮", "红烧鲍鱼", "干烹排骨", "麻辣牛肉", "主食（炸酱面 / 辣汤面）", "甜点"],
    },
    detail: {
      ko: "시후의 인기 메뉴를 부담 없이 경험할 수 있는 대표 코스입니다.",
      en: "Signature course to enjoy XI HU's most popular dishes at an approachable price.",
      zh: "可轻松品尝西湖人气菜品的招牌套餐。",
    },
  },
];

const spiceOptionKeys = ["순하게", "보통", "맵게"];
const sizeOptions = [
  { key: "일반", delta: 0 },
  { key: "곱배기", delta: 2000 },
];
const setOptions = [
  { key: "단품", delta: 0 },
  { key: "세트", delta: 3000 },
];

const recommendation = { menuId: "dumpling" };
const paymentMethodOptions = [
  { id: "card", code: "CARD", brand: "card", featured: true },
  { id: "easy-pay", code: "EASY-PAY", brand: "easypay" },
  { id: "kakao", code: "KAKAO", brand: "kakao" },
  { id: "naver", code: "NAVER", brand: "naver" },
  { id: "toss", code: "TOSS", brand: "toss" },
  { id: "cash", code: "CASH", brand: "cash" },
];

function PaymentBrandMark({ brand, label }) {
  const common = { width: 28, height: 28, "aria-hidden": "true" };
  switch (brand) {
    case "kakao":
      return (
        <svg {...common} viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#FEE500" /><text x="16" y="20" textAnchor="middle" fontSize="13" fontWeight="800" fill="#3C1E1E">K</text></svg>
      );
    case "naver":
      return (
        <svg {...common} viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#03C75A" /><text x="16" y="21" textAnchor="middle" fontSize="16" fontWeight="800" fill="#fff">N</text></svg>
      );
    case "toss":
      return (
        <svg {...common} viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#0064FF" /><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#fff">toss</text></svg>
      );
    case "easypay":
      return (
        <svg {...common} viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#1d4ed8" /><text x="16" y="21" textAnchor="middle" fontSize="11" fontWeight="800" fill="#fff">Pay</text></svg>
      );
    case "cash":
      return (
        <svg {...common} viewBox="0 0 32 32"><rect width="32" height="32" rx="6" fill="#43c478" /><text x="16" y="21" textAnchor="middle" fontSize="14" fontWeight="800" fill="#0e2418">₩</text></svg>
      );
    case "card":
    default:
      return (
        <svg {...common} viewBox="0 0 32 32"><rect x="2" y="6" width="28" height="20" rx="3" fill="#ff6333" /><rect x="2" y="11" width="28" height="3.5" fill="#0d131a" /><rect x="6" y="19" width="8" height="2.5" rx="1" fill="#fff" opacity="0.85" /></svg>
      );
  }
  // eslint-disable-next-line no-unreachable
  return label;
}
const orderStatusFlow = ["received", "queued", "cooking", "serving"];
const orderStatusToProgressIndex = {
  received: 0,
  queued: 1,
  cooking: 2,
  serving: 3,
};

const formatPrice = (value, copy) => `${value.toLocaleString()}${copy.unit}`;

const getPaymentMethodLabel = (copy, methodId) => {
  const index = Math.max(0, paymentMethodOptions.findIndex((option) => option.id === methodId));
  return copy.paymentMethods[index] ?? copy.paymentMethods[0];
};

const getCourseSequence = (course, language) => {
  if (!course?.courses) return [];
  return Array.isArray(course.courses) ? course.courses : course.courses[language] ?? course.courses.ko ?? [];
};

const getCoursePrepMinutes = (_course, stepIndex) => {
  const prepMinutes = [0, 8, 7, 8, 10, 12, 9, 6, 4];
  return prepMinutes[Math.min(stepIndex, prepMinutes.length - 1)] ?? 8;
};

const SPICY_KEYWORDS = ["짬뽕", "Jjamppong", "spicy", "Spicy", "辣", "麻辣", "마라", "맵", "hot", "Hot"];

const getMenuOptionGroups = (menu) => {
  if (!menu) return { spice: true, size: true };
  const nameKo = menu.names?.ko ?? "";
  const nameEn = menu.names?.en ?? "";
  const nameZh = menu.names?.zh ?? "";
  const notesKo = menu.notes?.ko ?? "";
  const haystack = `${nameKo} ${nameEn} ${nameZh} ${notesKo}`.toLowerCase();
  const isSpicy = SPICY_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()));

  const categoryRules = {
    noodle: { spice: true, size: true },
    cold: { spice: false, size: false },
    premium: { spice: false, size: false },
    new: { spice: isSpicy, size: false },
    fried: { spice: isSpicy, size: false },
    "side-drink": { spice: false, size: false },
    course: { spice: false, size: false },
  };

  return categoryRules[menu.category] ?? { spice: isSpicy, size: false };
};

const localizedOptionLabel = (group, key, language) => {
  if (group === "spice") {
    const index = spiceOptionKeys.indexOf(key);
    return index >= 0 ? languageLabels[language].spiceOptions[index] : key;
  }
  if (group === "size") {
    const index = sizeOptions.findIndex((option) => option.key === key);
    return index >= 0 ? languageLabels[language].sizeOptions[index] : key;
  }
  if (group === "set") {
    const index = setOptions.findIndex((option) => option.key === key);
    return index >= 0 ? languageLabels[language].setOptions[index] : key;
  }
  return key;
};

export default function App() {
  const [surfaceId, setSurfaceId] = useState("customer");
  const currentSurface = surfaces.find((surface) => surface.id === surfaceId);
  const CurrentIcon = currentSurface.icon;

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="인터페이스 카테고리">
        <div className="brand-block">
          <span>SK</span>
          <div>
            <strong>SMART Kitchen</strong>
            <small>Prototype</small>
          </div>
        </div>
        <nav className="surface-nav">
          {surfaces.map((surface) => {
            const Icon = surface.icon;
            return (
              <button className={surface.id === surfaceId ? "active" : ""} key={surface.id} onClick={() => setSurfaceId(surface.id)} type="button">
                <Icon size={20} />
                <span>{surface.label}</span>
                <small>{surface.description}</small>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="surface-workspace">
        <header className="workspace-header">
          <div>
            <span className="eyebrow">SMART Kitchen Interface</span>
            <h1>
              <CurrentIcon size={24} />
              {currentSurface.label}
            </h1>
          </div>
          <p>{currentSurface.description}</p>
        </header>

        {surfaceId === "customer" && <CustomerTablet onPlaceOrder={placeKitchenOrder} />}
        {surfaceId === "kitchen" && <KitchenHmi />}
        {surfaceId === "owner" && <OwnerConsole />}
      </main>
    </div>
  );
}

function CustomerTablet({ onPlaceOrder }) {
  const [language, setLanguage] = useState("ko");
  const [showLanding, setShowLanding] = useState(true);
  const [activeCategory, setActiveCategory] = useState("noodle");
  const [selectedMenu, setSelectedMenu] = useState(menuItems[0]);
  const [activeCourse, setActiveCourse] = useState(null);
  const [spice, setSpice] = useState("");
  const [size, setSize] = useState("");
  const [setType, setSetType] = useState("단품");
  const [quantity, setQuantity] = useState(1);
  const [requestMemo, setRequestMemo] = useState("");
  const [memoActive, setMemoActive] = useState(false);
  const [cart, setCart] = useState([]);
  const [optionModalMenu, setOptionModalMenu] = useState(null);
  const [showRecommendModal, setShowRecommendModal] = useState(false);
  const [showCartModal, setShowCartModal] = useState(false);
  const [showMobileOrderModal, setShowMobileOrderModal] = useState(false);
  const [isPaymentStep, setIsPaymentStep] = useState(false);
  const [paymentMode, setPaymentMode] = useState("prepaid");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [orderStatus, setOrderStatus] = useState("received");
  const [courseStep, setCourseStep] = useState(0);
  const [courseRequest, setCourseRequest] = useState(null);
  const [validation, setValidation] = useState("");
  const [orderCode, setOrderCode] = useState("");
  const [serviceNotice, setServiceNotice] = useState("");
  const [discountApplied, setDiscountApplied] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const dayNames = { ko: ["일", "월", "화", "수", "목", "금", "토"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], zh: ["日", "一", "二", "三", "四", "五", "六"] };
  const sidebarDate = `${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}(${dayNames[language][now.getDay()]})`;
  const sidebarTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const tableLabel = language === "ko" ? "TABLE.07" : language === "zh" ? "桌号 07" : "TABLE 07";
  const mobileOrderLabel = language === "ko" ? "모바일 주문" : language === "zh" ? "手机点餐" : "Mobile Order";
  const activeCategoryInfo = allCategories.find((category) => category.id === activeCategory);

  const copy = languageLabels[language];
  const isCourseCategory = activeCategory === "course";
  const activeItems = isCourseCategory ? courseMenus : menuItems;
  const categoryCounts = useMemo(() => {
    const counts = {};
    for (const item of menuItems) counts[item.category] = (counts[item.category] ?? 0) + 1;
    counts.course = courseMenus.length;
    return counts;
  }, []);
  const visibleItems = activeItems.filter((item) => item.category === activeCategory);
  const selectedSize = sizeOptions.find((option) => option.key === size);
  const selectedSet = setOptions.find((option) => option.key === setType);
  const unitPrice = selectedMenu.price + (selectedSize?.delta ?? 0) + (selectedSet?.delta ?? 0);
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discount = discountApplied ? 2000 : 0;
  const total = Math.max(0, subtotal - discount);
  const currentStep = orderCode ? 3 : isPaymentStep ? 2 : optionModalMenu ? 1 : 0;

  const selectCategory = (categoryId) => {
    setActiveCategory(categoryId);
    setIsPaymentStep(false);
    setMemoActive(false);
    setValidation("");
    if (categoryId === "course") {
      return;
    }
    const firstMenu = menuItems.find((item) => item.category === categoryId);
    if (firstMenu) {
      setSelectedMenu(firstMenu);
    }
  };

  const selectMenu = (menu) => {
    setSelectedMenu(menu);
    setIsPaymentStep(false);
    setSpice("");
    setSize("");
    setSetType("단품");
    setQuantity(1);
    setRequestMemo("");
    setMemoActive(false);
    setValidation("");
    setOptionModalMenu(menu);
  };

  const closeOptionModal = () => {
    setOptionModalMenu(null);
    setMemoActive(false);
    setValidation("");
  };

  const addItemToCart = (menu, itemQuantity, itemSpice, itemSize, itemSetType, memo, forcedPrice) => {
    const menuSize = sizeOptions.find((option) => option.key === itemSize);
    const menuSet = setOptions.find((option) => option.key === itemSetType);
    const price = forcedPrice ?? menu.price + (menuSize?.delta ?? 0) + (menuSet?.delta ?? 0);
    setIsPaymentStep(false);
    setCart((items) => {
      const matchIndex = items.findIndex(
        (it) =>
          it.menu.id === menu.id &&
          (it.spice ?? "") === (itemSpice ?? "") &&
          (it.size ?? "") === (itemSize ?? "") &&
          (it.setType ?? "") === (itemSetType ?? "") &&
          (it.requestMemo ?? "") === (memo ?? "") &&
          it.unitPrice === price,
      );
      if (matchIndex >= 0) {
        const next = items.slice();
        const existing = next[matchIndex];
        next[matchIndex] = {
          ...existing,
          quantity: Math.min(99, existing.quantity + itemQuantity),
        };
        return next;
      }
      return [...items, buildCartItem(menu, itemQuantity, itemSpice, itemSize, itemSetType, memo, price)];
    });
  };

  const addToCart = () => {
    const groups = getMenuOptionGroups(selectedMenu);
    if ((groups.spice && !spice) || (groups.size && !size)) {
      setValidation(copy.validateOptions);
      return;
    }
    const finalSpice = groups.spice ? spice : "보통";
    const finalSize = groups.size ? size : "일반";
    addItemToCart(selectedMenu, quantity, finalSpice, finalSize, setType, requestMemo);
    setMemoActive(false);
    setValidation("");
    setOptionModalMenu(null);
  };

  const addCourseToCart = (course) => {
    addItemToCart(course, course.minPeople, "코스", `${course.minPeople}인`, "예약 가능", "코스 상세 확인", course.price);
    setActiveCourse(null);
  };

  const recommendedMenu = useMemo(
    () => menuItems.find((item) => item.id === recommendation.menuId) ?? null,
    [],
  );

  const addRecommendation = () => {
    if (!recommendedMenu) return;
    addItemToCart(recommendedMenu, 1, "보통", "일반", "단품", "AI 추천");
    setDiscountApplied(true);
    setShowRecommendModal(false);
  };

  const openRecommendModal = () => setShowRecommendModal(true);
  const closeRecommendModal = () => setShowRecommendModal(false);

  const updateCartQuantity = (id, delta) => {
    setIsPaymentStep(false);
    setCart((items) =>
      items.map((item) => (item.id === id ? { ...item, quantity: Math.max(item.menu.minPeople ?? 1, item.quantity + delta) } : item)),
    );
  };

  const submitOrder = () => {
    if (cart.length === 0) {
      setValidation(copy.validateEmptyCart);
      return;
    }
    setIsPaymentStep(true);
    setShowCartModal(false);
    setValidation("");
  };

  const NON_COOKABLE_CATEGORIES = ["side-drink", "cold"];
  const pushOrderToKitchen = (paymentLabel) => {
    const items = cart.map((item) => {
      const opts = [item.spice, item.size, item.setType, item.requestMemo]
        .filter((value) => value && !["단품", "일반", "보통"].includes(value))
        .join(" · ");
      return {
        name: item.menu.names.ko,
        qty: item.quantity,
        price: item.unitPrice,
        options: opts,
        cookable: !NON_COOKABLE_CATEGORIES.includes(item.menu.category),
      };
    });
    const memo = cart.find((item) => item.requestMemo)?.requestMemo ?? "";
    return (
      onPlaceOrder?.({
        items,
        total,
        table: "07",
        channel: "테이블 태블릿",
        payment: paymentLabel,
        memo,
        estMinutes: 7,
      }) ?? null
    );
  };

  const placePostpaidOrder = () => {
    if (cart.length === 0) {
      setValidation(copy.validateEmptyCart);
      return;
    }
    setPaymentMethod("postpaid");
    setOrderStatus("received");
    const code = pushOrderToKitchen("후불 (식후 결제)");
    setOrderCode(code ?? `A12-${String(cart.length + 24).padStart(3, "0")}`);
    setIsPaymentStep(false);
    setShowCartModal(false);
    setValidation("");
  };

  const openCartModal = () => setShowCartModal(true);
  const closeCartModal = () => setShowCartModal(false);

  const confirmOrder = () => {
    setOrderStatus("received");
    const methodLabel = getPaymentMethodLabel(copy, paymentMethod);
    const code = pushOrderToKitchen(`${methodLabel} 완료`);
    setOrderCode(code ?? `A12-${String(cart.length + 24).padStart(3, "0")}`);
    setIsPaymentStep(false);
    setCourseRequest(null);
    setValidation("");
  };

  const advanceOrderStatus = () => {
    setOrderStatus((status) => {
      const nextIndex = Math.min(orderStatusFlow.length - 1, orderStatusFlow.indexOf(status) + 1);
      return orderStatusFlow[nextIndex] ?? "received";
    });
  };

  const requestNextCourse = () => {
    if (courseRequest?.fromStep === courseStep) {
      setCourseStep((step) => step + 1);
      setCourseRequest(null);
      setOrderStatus("serving");
      return;
    }
    setCourseRequest({ fromStep: courseStep, requestedAt: Date.now() });
    setOrderStatus("cooking");
  };

  const noticeTimerRef = useRef(null);
  const requestService = (message) => {
    setServiceNotice(`${message} ${copy.serviceNoticeSuffix}`);
    if (noticeTimerRef.current) clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = setTimeout(() => setServiceNotice(""), 3000);
  };
  const resetOrder = () => {
    setOrderCode("");
    setCart([]);
    setIsPaymentStep(false);
    setShowLanding(false);
    setShowCartModal(false);
    setActiveCategory(generalCategories[0].id);
    setOrderStatus("received");
    setCourseStep(0);
    setCourseRequest(null);
    setDiscountApplied(false);
    setValidation("");
    setServiceNotice("");
  };
  const appendMemo = (text) => {
    setRequestMemo((value) => (value ? `${value} ${text}` : text));
    setMemoActive(true);
  };
  const appendKey = (key) => {
    setRequestMemo((value) => `${value}${key}`);
    setMemoActive(true);
  };
  const backspaceMemo = () => setRequestMemo((value) => value.slice(0, -1));
  const spaceMemo = () => setRequestMemo((value) => `${value} `);
  const closeKeyboard = () => setMemoActive(false);

  return (
    <section className="tablet-stage" aria-label="고객 태블릿 실사용 UI">
      <div className={showLanding ? "tablet-device landing-mode" : "tablet-device"}>
        {showLanding ? (
          <>
            <header className="tablet-header landing-header">
              <div className="header-title">
                <h1>
                  UND<small> SMART KITCHEN</small>
                </h1>
                <span className="table-chip">{tableLabel}</span>
              </div>
              <div className="header-actions" role="group" aria-label="언어 선택">
                {[
                  ["ko", "한"],
                  ["en", "ENG"],
                  ["zh", "中"],
                ].map(([value, label]) => (
                  <button className={language === value ? "active" : ""} key={value} onClick={() => setLanguage(value)} type="button">
                    {label}
                  </button>
                ))}
                <button className="staff" onClick={() => requestService(copy.staff)} type="button">
                  <Bell size={14} />
                  {copy.staff}
                </button>
              </div>
            </header>
            <TabletLanding copy={copy} onStart={() => setShowLanding(false)} requestService={requestService} />
          </>
        ) : (
          <>
            <header className="tablet-header">
              <div className="header-title">
                <div className="sidebar-logo">
                  <strong>UND</strong>
                  <span>SMART KITCHEN</span>
                </div>
              </div>
              <div className="header-actions">
                <div className="header-clock" aria-label="현재 시각">
                  <span>{sidebarDate}</span>
                  <b>{sidebarTime}</b>
                </div>
                <div className="header-lang" role="group" aria-label="언어 선택">
                  {[
                    ["ko", "한"],
                    ["en", "ENG"],
                    ["zh", "中"],
                  ].map(([value, label]) => (
                    <button className={language === value ? "active" : ""} key={value} onClick={() => setLanguage(value)} type="button">
                      {label}
                    </button>
                  ))}
                </div>
                <button className="staff" onClick={() => requestService(copy.staff)} type="button">
                  <Bell size={14} />
                  {copy.staff}
                </button>
                {!orderCode && (
                  <button
                    className="header-cart"
                    data-testid="open-cart"
                    onClick={openCartModal}
                    type="button"
                  >
                    {copy.orderHistory}
                    {cart.length > 0 && <span className="header-cart-badge">{cart.length}</span>}
                  </button>
                )}
                <span className="table-chip header-table">{tableLabel}</span>
              </div>
            </header>

          <div className={isPaymentStep ? "tablet-shell payment-mode" : "tablet-shell"}>
            <aside className="tablet-categories" aria-label="메뉴 카테고리">
              <div className="category-list">
                {allCategories.map((category) => (
                  <button
                    className={activeCategory === category.id ? "active" : ""}
                    data-testid={`category-${category.id}`}
                    key={category.id}
                    onClick={() => selectCategory(category.id)}
                    type="button"
                  >
                    <span>
                      {category.labels[language]}
                      <small>({categoryCounts[category.id] ?? 0})</small>
                    </span>
                  </button>
                ))}
              </div>
              <button
                className="sidebar-mobile-order"
                data-testid="open-mobile-order"
                onClick={() => setShowMobileOrderModal(true)}
                type="button"
                aria-label={mobileOrderLabel}
              >
                <QrCode size={28} />
                <span>{mobileOrderLabel}</span>
              </button>
            </aside>

            <div className="tablet-main">
              <div className={isPaymentStep ? "tablet-body payment-layout" : "tablet-body"}>
                {isPaymentStep ? (
                  <PaymentStep
                    cart={cart}
                    copy={copy}
                    discount={discount}
                    language={language}
                    onBack={() => setIsPaymentStep(false)}
                    onConfirm={confirmOrder}
                    paymentMethod={paymentMethod}
                    requestService={requestService}
                    setPaymentMethod={setPaymentMethod}
                    subtotal={subtotal}
                    total={total}
                  />
                ) : (
                  <section className="tablet-menu" aria-label="메뉴 목록">
                    {activeCategoryInfo && (
                      <h1 className="page-title">{activeCategoryInfo.labels[language]}</h1>
                    )}
                    <div className={`food-grid${visibleItems.length === 0 ? " empty" : ""}`}>
                      {visibleItems.length === 0 ? (
                        <div className="empty-category">{copy.noMenus}</div>
                      ) : isCourseCategory ? (
                        visibleItems.map((course) => (
                          <CourseCard copy={copy} course={course} key={course.id} language={language} onDetail={setActiveCourse} />
                        ))
                      ) : (
                        visibleItems.map((menu) => (
                          <MenuCard copy={copy} key={menu.id} language={language} menu={menu} onQuickAdd={selectMenu} />
                        ))
                      )}
                      {activeCategory === "side-drink" && visibleItems.length > 0 && (
                        <>
                          <ServiceCard
                            copy={copy}
                            label={copy.water}
                            icon={<Droplet size={56} strokeWidth={1.6} />}
                            onRequest={() => requestService(copy.water)}
                          />
                          <ServiceCard
                            copy={copy}
                            label={copy.sideDish}
                            icon={<Utensils size={56} strokeWidth={1.6} />}
                            onRequest={() => requestService(copy.sideDish)}
                          />
                        </>
                      )}
                    </div>
                  </section>
                )}
              </div>

              <footer className="tablet-footer">
                <span>
                  {copy.footerHelp} · {copy.allergy}
                </span>
              </footer>
            </div>

            {orderCode && (
              <section className="order-complete-overlay" data-testid="order-complete-overlay">
                <OrderComplete
                  copy={copy}
                  language={language}
                  orderCode={orderCode}
                  orderStatus={orderStatus}
                  orderedItems={cart}
                  total={total}
                  courseStep={courseStep}
                  courseRequest={courseRequest}
                  onAdvance={advanceOrderStatus}
                  onRequestNext={requestNextCourse}
                  requestService={requestService}
                  onReset={resetOrder}
                />
              </section>
            )}
          </div>
          </>
        )}

        {optionModalMenu && (
          <MenuOptionModal
            copy={copy}
            language={language}
            menu={optionModalMenu}
            unitPrice={unitPrice}
            spice={spice}
            setSpice={setSpice}
            size={size}
            setSize={setSize}
            requestMemo={requestMemo}
            setRequestMemo={setRequestMemo}
            memoActive={memoActive}
            setMemoActive={setMemoActive}
            quantity={quantity}
            setQuantity={setQuantity}
            validation={validation}
            onAdd={addToCart}
            onClose={closeOptionModal}
            appendMemo={appendMemo}
            appendKey={appendKey}
            backspaceMemo={backspaceMemo}
            spaceMemo={spaceMemo}
            closeKeyboard={closeKeyboard}
          />
        )}

        {activeCourse && <CourseDetailModal copy={copy} course={activeCourse} language={language} onAdd={addCourseToCart} onClose={() => setActiveCourse(null)} />}

        {showMobileOrderModal && (
          <MobileOrderModal copy={copy} tableLabel={tableLabel} onClose={() => setShowMobileOrderModal(false)} />
        )}

        {showCartModal && !orderCode && !isPaymentStep && (
          <CartModal
            cart={cart}
            copy={copy}
            language={language}
            setCart={setCart}
            updateCartQuantity={updateCartQuantity}
            subtotal={subtotal}
            discount={discount}
            total={total}
            paymentMode={paymentMode}
            setPaymentMode={setPaymentMode}
            onPay={submitOrder}
            onPlace={placePostpaidOrder}
            onOpenRecommend={openRecommendModal}
            onClose={closeCartModal}
            validation={validation}
          />
        )}

        {showRecommendModal && (
          <AIRecommendModal
            copy={copy}
            language={language}
            menu={recommendedMenu}
            onAdd={addRecommendation}
            onClose={closeRecommendModal}
          />
        )}

        {serviceNotice && (
          <div className="global-toast" role="status" aria-live="polite" data-testid="service-toast">
            <Bell size={16} />
            <span>{serviceNotice}</span>
          </div>
        )}
      </div>
    </section>
  );
}

function TabletLanding({ copy, onStart, requestService }) {
  return (
    <main className="tablet-landing" data-testid="tablet-landing">
      <section className="landing-hero">
        <div>
          <h2>{copy.landingTitle}</h2>
          <p>{copy.landingSubtitle}</p>
        </div>
        <div className="landing-actions">
          <button className="primary-action large" data-testid="start-order" onClick={onStart} type="button">
            {copy.startOrder}
          </button>
          <button className="secondary-action" onClick={() => requestService(copy.staff)} type="button">
            <Bell size={16} />
            {copy.staff}
          </button>
        </div>
      </section>
      <aside className="landing-side">
        <div className="landing-wait-card">
          <Clock3 size={28} />
          <span>{copy.currentWait}</span>
          <strong>{copy.waitValue}</strong>
          <div className="landing-wait-row">
            <span>{copy.waitingTeams}</span>
            <b>{copy.waitingTeamsValue}</b>
          </div>
          <small>{copy.waitBase}</small>
        </div>
      </aside>
    </main>
  );
}

function MenuCard({ copy, language, menu, onQuickAdd }) {
  return (
    <article className="food-card" data-testid="food-card">
      <div className="food-photo">
        <img alt={`${menu.names[language]} 사진`} src={menu.image} />
        <span className={menu.tag === "NEW" || menu.tag === "신메뉴" ? "new" : ""}>{menu.tag}</span>
        <b>★ {menu.rating}</b>
      </div>
      <strong className="food-title">{menu.names[language]}</strong>
      <div className="food-card-bottom">
        <b>{formatPrice(menu.price, copy)}</b>
        <button className="card-add" data-testid={`quick-add-${menu.id}`} onClick={() => onQuickAdd(menu)} type="button">
          {copy.add}
        </button>
      </div>
    </article>
  );
}

function ServiceCard({ copy, label, icon, onRequest }) {
  return (
    <article className="food-card service-card" data-testid={`service-card-${label}`}>
      <div className="food-photo service-photo">
        {icon}
      </div>
      <strong className="food-title">{label}</strong>
      <div className="food-card-bottom">
        <b className="service-tag">{copy.staff}</b>
        <button className="card-add" onClick={onRequest} type="button">
          {copy.add}
        </button>
      </div>
    </article>
  );
}

function CourseCard({ copy, course, language, onDetail }) {
  return (
    <article className="food-card course-card" data-testid="course-card">
      <div className="food-photo course-photo">
        <img alt={`${course.names[language]} 사진`} src={course.image} />
        <span>{course.tag}</span>
        <b>
          {course.minPeople}
          {copy.minPeopleSuffix}
        </b>
      </div>
      <strong className="food-title">{course.names[language]}</strong>
      <div className="food-card-bottom">
        <b>
          {formatPrice(course.price, copy)} / {copy.perPerson}
        </b>
        <button className="card-add detail" data-testid={`course-detail-${course.id}`} onClick={() => onDetail(course)} type="button">
          {copy.detail}
        </button>
      </div>
    </article>
  );
}

function CourseDetailModal({ copy, course, language, onAdd, onClose }) {
  const courseList = Array.isArray(course.courses) ? course.courses : course.courses[language] ?? course.courses.ko;
  const detailText = typeof course.detail === "string" ? course.detail : course.detail[language] ?? course.detail.ko;
  return (
    <div className="course-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.courseDetailLabel}>
      <section className="course-modal">
        <header>
          <div>
            <span>{copy.courseDetailLabel}</span>
            <h2>{course.names[language]}</h2>
            {language === "en" && <p>{course.romanized}</p>}
          </div>
          <button aria-label={copy.modalClose} onClick={onClose} type="button">
            <XCircle size={22} />
          </button>
        </header>
        <div className="course-modal-body">
          <div className="course-summary">
            <img alt="" src={course.image} />
            <div>
              <strong>
                {formatPrice(course.price, copy)} / {copy.perPerson}
              </strong>
              <span>
                {course.minPeople}
                {copy.courseOrderable}
              </span>
              <p>{detailText}</p>
            </div>
          </div>
          <ol className="course-sequence">
            {courseList.map((item, index) => (
              <li key={item}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{item}</p>
              </li>
            ))}
          </ol>
        </div>
        <footer>
          <button className="secondary-action" onClick={onClose} type="button">
            {copy.modalClose}
          </button>
          <button className="primary-action large" data-testid="add-course" onClick={() => onAdd(course)} type="button">
            {copy.courseAddBtn} ({course.minPeople}
            {copy.courseAddPersonsSuffix})
          </button>
        </footer>
      </section>
    </div>
  );
}

function MenuOptionModal({
  copy,
  language,
  menu,
  unitPrice,
  spice,
  setSpice,
  size,
  setSize,
  requestMemo,
  setRequestMemo,
  memoActive,
  setMemoActive,
  quantity,
  setQuantity,
  validation,
  onAdd,
  onClose,
  appendMemo,
  appendKey,
  backspaceMemo,
  spaceMemo,
  closeKeyboard,
}) {
  const optionGroups = getMenuOptionGroups(menu);
  return (
    <div className="course-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.selectedMenu}>
      <section className="course-modal option-modal" data-testid="option-modal">
        <header>
          <div>
            <span>{copy.selectedMenu}</span>
            <h2>{menu.names[language]}</h2>
            {language === "en" && <p>{menu.romanized}</p>}
          </div>
        </header>
        <div className="course-modal-body option-modal-body">
          <div className="option-modal-summary">
            <img alt="" src={menu.image} />
            <div>
              <strong>{formatPrice(unitPrice, copy)} / {copy.pricePerUnit}</strong>
              <p>{menu.notes[language]}</p>
            </div>
          </div>
          <SelectedOptions
            copy={copy}
            language={language}
            selectedMenu={menu}
            unitPrice={unitPrice}
            spice={spice}
            setSpice={setSpice}
            size={size}
            setSize={setSize}
            requestMemo={requestMemo}
            setRequestMemo={setRequestMemo}
            setMemoActive={setMemoActive}
            quantity={quantity}
            setQuantity={setQuantity}
            validation={validation}
            hideMenuHeader
            optionGroups={optionGroups}
          />
          {memoActive && (
            <TouchKeyboard
              copy={copy}
              onAppend={appendMemo}
              onKey={appendKey}
              onBackspace={backspaceMemo}
              onSpace={spaceMemo}
              onClose={closeKeyboard}
            />
          )}
        </div>
        <footer>
          <button className="secondary-action" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          <button className="primary-action large add-to-cart-cta" data-testid="add-to-cart" onClick={onAdd} type="button">
            <span className="qty-badge" aria-hidden="true">{quantity}</span>
            <span className="cta-label">{formatPrice(unitPrice * quantity, copy)} {copy.addToCartCta}</span>
          </button>
        </footer>
      </section>
    </div>
  );
}

function buildCartItem(menu, quantity, spice, size, setType, requestMemo, unitPrice = menu.price) {
  return {
    id: `${menu.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    menu,
    spice,
    size,
    setType,
    requestMemo,
    quantity,
    unitPrice,
  };
}

function SelectedOptions({
  copy,
  language,
  selectedMenu,
  unitPrice,
  spice,
  setSpice,
  size,
  setSize,
  requestMemo,
  setRequestMemo,
  setMemoActive,
  quantity,
  setQuantity,
  validation,
  hideMenuHeader = false,
  optionGroups = { spice: true, size: true },
}) {
  const spiceLabels = copy.spiceOptions;
  const sizeLabels = copy.sizeOptions;
  const hasAnyOption = optionGroups.spice || optionGroups.size;
  return (
    <section className="selected-options">
      {!hideMenuHeader && (
        <div className="selected-menu">
          <span>{copy.selectedMenu}</span>
          <strong>{selectedMenu.names[language]}</strong>
          <b>
            {formatPrice(unitPrice, copy)} / {copy.pricePerUnit}
          </b>
        </div>
      )}
      {hasAnyOption && (
        <div className="option-row">
          {optionGroups.spice && (
            <OptionGroup
              groupKey="spice"
              label={copy.spice}
              options={spiceOptionKeys.map((key, idx) => ({ key, label: spiceLabels[idx] }))}
              value={spice}
              onChange={setSpice}
            />
          )}
          {optionGroups.size && (
            <OptionGroup
              groupKey="size"
              label={copy.size}
              options={sizeOptions.map((option, idx) => ({ key: option.key, label: sizeLabels[idx] }))}
              value={size}
              onChange={setSize}
            />
          )}
        </div>
      )}
      <div className="option-row qty-only">
        <div className="qty-row">
          <span>{copy.qty}</span>
          <div>
            <button aria-label={copy.qtyDown} onClick={() => setQuantity((value) => Math.max(1, value - 1))} type="button">
              <Minus size={15} />
            </button>
            <strong>{quantity}</strong>
            <button aria-label={copy.qtyUp} onClick={() => setQuantity((value) => value + 1)} type="button">
              <Plus size={15} />
            </button>
          </div>
        </div>
      </div>
      <label className="memo-input">
        {copy.memo}
        <input onChange={(event) => setRequestMemo(event.target.value)} onFocus={() => setMemoActive(true)} placeholder={copy.memoPlaceholder} value={requestMemo} />
      </label>
      {validation && (
        <div className="validation" role="alert">
          {validation}
        </div>
      )}
    </section>
  );
}

function TouchKeyboard({ copy, onAppend, onKey, onBackspace, onSpace, onClose }) {
  const rows = [
    ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
    ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
    ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
  ];
  return (
    <div className="touch-keyboard" data-testid="touch-keyboard">
      <div className="quick-memo">
        {copy.quickMemos.map((item) => (
          <button key={item} onClick={() => onAppend(item)} type="button">
            {item}
          </button>
        ))}
      </div>
      <div className="keyboard">
        {rows.map((row, rowIndex) => (
          <div className="kb-row" key={rowIndex}>
            {row.map((key) => (
              <button className="kb-key" key={key} onClick={() => onKey(key)} type="button">
                {key}
              </button>
            ))}
          </div>
        ))}
        <div className="kb-row kb-row-control">
          <button className="kb-key wide" onClick={onBackspace} type="button" aria-label="backspace">
            ⌫
          </button>
          <button className="kb-key space" onClick={onSpace} type="button">
            space
          </button>
          <button className="kb-key done" onClick={onClose} type="button">
            {copy.modalClose}
          </button>
        </div>
      </div>
    </div>
  );
}

function OptionGroup({ groupKey, label, options, value, onChange }) {
  return (
    <div className="option-group">
      <span>{label}</span>
      <div>
        {options.map((option, index) => (
          <button
            className={value === option.key ? "selected" : ""}
            data-testid={`option-${groupKey}-${index}`}
            key={option.key}
            onClick={() => onChange(option.key)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Cart({ cart, copy, language, setCart, updateCartQuantity }) {
  const removeItem = (id) => setCart((items) => items.filter((item) => item.id !== id));
  const clearAll = () => setCart([]);
  const listRef = useRef(null);
  const prevLength = useRef(cart.length);

  useEffect(() => {
    if (cart.length > prevLength.current && listRef.current) {
      const items = listRef.current.querySelectorAll(".cart-item");
      const last = items[items.length - 1];
      if (last) {
        last.scrollIntoView({ behavior: "smooth", block: "nearest" });
        last.classList.add("just-added");
        const timer = setTimeout(() => last.classList.remove("just-added"), 1200);
        return () => clearTimeout(timer);
      }
    }
    prevLength.current = cart.length;
  }, [cart.length]);

  return (
    <section className="cart-panel">
      {cart.length > 0 && (
        <div className="cart-panel-head">
          <button className="clear-all" onClick={clearAll} type="button">
            <Trash2 size={14} />
            {copy.clearAll}
          </button>
        </div>
      )}
      {cart.length === 0 ? (
        <p className="empty-cart">{copy.emptyCart}</p>
      ) : (
        <ul className="cart-list" ref={listRef} role="list" aria-label={copy.orderHistory}>
          {cart.map((item) => {
            const menuName = item.menu.names[language] ?? item.menu.names.ko;
            const itemGroups = getMenuOptionGroups(item.menu);
            const spiceLabel = item.spice && itemGroups.spice ? localizedOptionLabel("spice", item.spice, language) : "";
            const sizeLabel = item.size && itemGroups.size ? localizedOptionLabel("size", item.size, language) : "";
            const optionLine = [
              spiceLabel && `${copy.cartSpiceLabel} ${spiceLabel}`,
              sizeLabel && `${copy.cartSizeLabel} ${sizeLabel}`,
            ]
              .filter(Boolean)
              .join(" · ");
            const isMin = item.quantity <= 1;
            const isMax = item.quantity >= 99;
            return (
              <li className="cart-item" data-testid="cart-item" key={item.id}>
                <div className="cart-item-head">
                  <strong title={menuName}>{menuName}</strong>
                  <button className="remove-item" aria-label={`${menuName} ${copy.removeItem}`} onClick={() => removeItem(item.id)} type="button">
                    <XCircle size={18} />
                  </button>
                </div>
                {(optionLine || item.requestMemo) && (
                  <div className="cart-item-options">
                    {optionLine && <span>{optionLine}</span>}
                    {item.requestMemo && (
                      <span className="memo" title={item.requestMemo}>
                        {copy.cartMemoLabel} · {item.requestMemo}
                      </span>
                    )}
                  </div>
                )}
                <div className="cart-item-foot">
                  <div className="cart-qty" role="group" aria-label={`${menuName} ${copy.qtyUp}`}>
                    <button aria-label={`${menuName} ${copy.qtyDown}`} disabled={isMin} onClick={() => updateCartQuantity(item.id, -1)} type="button">
                      <Minus size={14} />
                    </button>
                    <span aria-live="polite" aria-atomic="true">{item.quantity}</span>
                    <button aria-label={`${menuName} ${copy.qtyUp}`} disabled={isMax} onClick={() => updateCartQuantity(item.id, 1)} type="button">
                      <Plus size={14} />
                    </button>
                  </div>
                  <b aria-live="polite">{formatPrice(item.unitPrice * item.quantity, copy)}</b>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function RecommendationCard({ copy, onOpen }) {
  return (
    <button className="recommend-card" data-testid="recommend-card" onClick={onOpen} type="button">
      <div>
        <span>{copy.aiRecommend}</span>
        <strong>{copy.aiRecommendTitle}</strong>
      </div>
      <span className="recommend-cta" aria-hidden="true">
        {copy.detail}
      </span>
    </button>
  );
}

function AIRecommendModal({ copy, language, menu, onAdd, onClose }) {
  if (!menu) return null;
  return (
    <div className="course-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.aiRecommend}>
      <section className="course-modal recommend-modal" data-testid="recommend-modal">
        <header>
          <div>
            <span>{copy.aiRecommend}</span>
            <h2>{copy.aiRecommendModalLead}</h2>
            <p>{copy.aiRecommendTitle}</p>
          </div>
          <button aria-label={copy.modalClose} onClick={onClose} type="button">
            <XCircle size={22} />
          </button>
        </header>
        <div className="course-modal-body recommend-modal-body">
          <div className="recommend-summary">
            <img alt="" src={menu.image} />
            <div>
              <strong>{menu.names[language]}</strong>
              {language === "en" && <small>{menu.romanized}</small>}
              <b>{formatPrice(menu.price, copy)}</b>
              <p>{menu.notes[language]}</p>
            </div>
          </div>
          <div className="recommend-benefit">
            <Flame size={18} aria-hidden="true" />
            <div>
              <strong>{copy.aiRecommendModalBenefit}</strong>
              <p>{copy.aiRecommendModalReason}</p>
            </div>
          </div>
        </div>
        <footer>
          <button className="secondary-action" onClick={onClose} type="button">
            {copy.aiRecommendCancel}
          </button>
          <button className="primary-action large" data-testid="recommend-add" onClick={onAdd} type="button">
            {copy.aiAdd} · {formatPrice(menu.price, copy)}
          </button>
        </footer>
      </section>
    </div>
  );
}

function MobileOrderModal({ copy, tableLabel, onClose }) {
  return (
    <div className="course-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.mobileOrderTitle}>
      <section className="course-modal qr-modal" data-testid="mobile-order-modal">
        <header className="qr-header">
          <div className="qr-brand">
            <strong>UND</strong>
            <span>{tableLabel}</span>
          </div>
          <button className="qr-close" aria-label={copy.modalClose} onClick={onClose} type="button">
            <XCircle size={24} />
          </button>
          <h2 className="qr-title">{copy.mobileOrderTitle}</h2>
        </header>
        <div className="course-modal-body qr-modal-body">
          <div className="qr-frame" aria-hidden="true">
            <QrPlaceholder />
          </div>
          <p className="qr-hint">{copy.mobileOrderHint}</p>
        </div>
      </section>
    </div>
  );
}

function QrPlaceholder() {
  const cells = [];
  const seed = "smartkitchen-table-07-mobile-order";
  for (let row = 0; row < 21; row += 1) {
    for (let col = 0; col < 21; col += 1) {
      const isFinderTL = row < 7 && col < 7;
      const isFinderTR = row < 7 && col > 13;
      const isFinderBL = row > 13 && col < 7;
      let dark = false;
      if (isFinderTL || isFinderTR || isFinderBL) {
        const localRow = isFinderBL ? row - 14 : row;
        const localCol = isFinderTR ? col - 14 : col;
        const ringOuter = localRow === 0 || localRow === 6 || localCol === 0 || localCol === 6;
        const ringInner = localRow >= 2 && localRow <= 4 && localCol >= 2 && localCol <= 4;
        dark = ringOuter || ringInner;
      } else {
        const idx = row * 21 + col;
        dark = ((seed.charCodeAt(idx % seed.length) + row * 7 + col * 3) % 5) < 2;
      }
      if (dark) cells.push(<rect key={`${row}-${col}`} x={col} y={row} width={1} height={1} fill="#0d131a" />);
    }
  }
  return (
    <svg viewBox="0 0 21 21" className="qr-svg" aria-hidden="true">
      <rect width="21" height="21" fill="#fff" />
      {cells}
    </svg>
  );
}

function PriceSummary({ copy, cart, subtotal, discount, total }) {
  const totalQty = Array.isArray(cart) ? cart.reduce((sum, item) => sum + (item.quantity || 0), 0) : 0;
  return (
    <section className="price-summary">
      <div>
        <span>{copy.subtotal}</span>
        <b>{formatPrice(subtotal, copy)}</b>
      </div>
      <div>
        <span>{copy.discount}</span>
        <b className="discount">{discount > 0 ? `-${formatPrice(discount, copy)}` : formatPrice(0, copy)}</b>
      </div>
      <div className="total">
        <span>{copy.total}</span>
        <div className="total-value">
          {totalQty > 0 && (
            <em className="total-qty">
              {copy.totalCount} {totalQty}
              {copy.countSuffix}
            </em>
          )}
          <strong>{formatPrice(total, copy)}</strong>
        </div>
      </div>
    </section>
  );
}

function CartModal({
  cart,
  copy,
  language,
  setCart,
  updateCartQuantity,
  subtotal,
  discount,
  total,
  paymentMode,
  setPaymentMode,
  onPay,
  onPlace,
  onOpenRecommend,
  onClose,
  validation,
}) {
  const isEmpty = cart.length === 0;
  return (
    <div className="course-modal-backdrop" role="dialog" aria-modal="true" aria-label={copy.myOrder}>
      <section className="course-modal cart-modal" data-testid="cart-modal">
        <header>
          <div>
            <span>{copy.myOrder}</span>
          </div>
          <button aria-label={copy.modalClose} onClick={onClose} type="button">
            <XCircle size={22} />
          </button>
        </header>
        <div className="course-modal-body cart-modal-body">
          <Cart cart={cart} copy={copy} language={language} setCart={setCart} updateCartQuantity={updateCartQuantity} />
          {!isEmpty && <RecommendationCard copy={copy} onOpen={onOpenRecommend} />}
          {!isEmpty && (
            <div className="payment-mode-toggle" role="tablist" aria-label={copy.modeLabel}>
              <button
                className={paymentMode === "prepaid" ? "active" : ""}
                data-testid="mode-prepaid"
                onClick={() => setPaymentMode("prepaid")}
                role="tab"
                aria-selected={paymentMode === "prepaid"}
                type="button"
              >
                {copy.modePrepaid}
              </button>
              <button
                className={paymentMode === "postpaid" ? "active" : ""}
                data-testid="mode-postpaid"
                onClick={() => setPaymentMode("postpaid")}
                role="tab"
                aria-selected={paymentMode === "postpaid"}
                type="button"
              >
                {copy.modePostpaid}
              </button>
            </div>
          )}
          {!isEmpty && <PriceSummary copy={copy} cart={cart} discount={discount} subtotal={subtotal} total={total} />}
          {validation && (
            <div className="validation" role="alert">
              {validation}
            </div>
          )}
        </div>
        <footer>
          <button className="secondary-action" onClick={onClose} type="button">
            {copy.cancel}
          </button>
          {paymentMode === "prepaid" ? (
            <button
              className="primary-action large"
              data-testid="submit-order"
              disabled={isEmpty}
              onClick={onPay}
              type="button"
            >
              {copy.payNow}
            </button>
          ) : (
            <button
              className="primary-action large"
              data-testid="place-postpaid"
              disabled={isEmpty}
              onClick={onPlace}
              type="button"
            >
              {copy.orderNow}
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}

function PaymentStep({
  cart,
  copy,
  discount,
  language,
  onBack,
  onConfirm,
  paymentMethod,
  requestService,
  setPaymentMethod,
  subtotal,
  total,
}) {
  const [agreements, setAgreements] = useState([true, true, false]);
  const allRequiredChecked = agreements[0] && agreements[1];
  const allChecked = agreements.every(Boolean);
  const toggleAgreement = (index) => {
    setAgreements((prev) => prev.map((value, i) => (i === index ? !value : value)));
  };
  const toggleAllAgreements = () => {
    setAgreements(allChecked ? [false, false, false] : [true, true, true]);
  };
  const agreementItems = [
    { label: copy.paymentPrivacy, required: true },
    { label: copy.paymentTerms, required: true },
    { label: copy.paymentMarketing, required: false },
  ];
  return (
    <section className="payment-screen" data-testid="payment-step">
      <div className="payment-main">
        <header className="payment-heading">
          <div>
            <h2>{copy.paymentTitle}</h2>
            <p>{copy.paymentHint}</p>
          </div>
        </header>
        <div className="payment-method-grid" role="radiogroup" aria-label={copy.paymentMethod}>
          {paymentMethodOptions.map((option, index) => {
            const selected = paymentMethod === option.id;
            return (
              <button
                className={`payment-method-card brand-${option.brand}${option.featured ? " featured" : ""}${selected ? " selected" : ""}`}
                data-testid={`payment-method-${option.id}`}
                key={option.id}
                onClick={() => setPaymentMethod(option.id)}
                role="radio"
                aria-checked={selected}
                type="button"
              >
                <PaymentBrandMark brand={option.brand} label={option.code} />
                <strong>{copy.paymentMethods[index]}</strong>
                <span>{copy.paymentMethodNotes[index]}</span>
                {selected && <em aria-hidden="true">{copy.paymentSelected}</em>}
              </button>
            );
          })}
        </div>
      </div>
      <aside className="payment-summary" data-testid="payment-summary">
        <div className="payment-summary-head">
          <button className="payment-back" onClick={onBack} type="button" aria-label={copy.editOrder}>
            <ArrowLeft size={18} />
          </button>
          <span>{copy.paymentSummary}</span>
        </div>
        <OrderReview cart={cart} copy={copy} language={language} />
        <PriceSummary copy={copy} cart={cart} discount={discount} subtotal={subtotal} total={total} />
        <div className="payment-receipt-info">
          <span>{copy.receiptInfo}</span>
          <dl>
            <div>
              <dt>{copy.paymentMethod}</dt>
              <dd>{getPaymentMethodLabel(copy, paymentMethod)}</dd>
            </div>
          </dl>
        </div>
        <fieldset className="payment-agreements" aria-label={copy.paymentAgreement}>
          <button
            className={`payment-agreement-all${allChecked ? " checked" : ""}`}
            onClick={toggleAllAgreements}
            type="button"
            aria-pressed={allChecked}
          >
            <i />
            <span>{copy.paymentAgreeAll ?? "전체 동의"}</span>
          </button>
          <div className="payment-agreement-divider" />
          {agreementItems.map((item, index) => (
            <button
              className={`payment-agreement-item${agreements[index] ? " checked" : ""}${item.required ? "" : " optional"}`}
              data-testid={`payment-agreement-${index}`}
              key={item.label}
              onClick={() => toggleAgreement(index)}
              type="button"
              aria-pressed={agreements[index]}
            >
              <i />
              <em>{item.required ? (copy.required ?? "필수") : (copy.optional ?? "선택")}</em>
              <span>{item.label}</span>
            </button>
          ))}
        </fieldset>
        <div className="payment-actions">
          <button
            className="primary-action large pay-confirm"
            data-testid="confirm-order"
            disabled={!allRequiredChecked}
            onClick={onConfirm}
            type="button"
            aria-describedby={!allRequiredChecked ? "pay-confirm-help" : undefined}
          >
            <span className="cta-label">{copy.confirmOrder}</span>
            <span className="cta-amount" aria-hidden="true">{formatPrice(total, copy)}</span>
          </button>
          {!allRequiredChecked && (
            <small className="pay-confirm-help" id="pay-confirm-help" role="status">
              {copy.paymentAgreeHint ?? "필수 동의 항목을 확인해주세요."}
            </small>
          )}
        </div>
      </aside>
    </section>
  );
}

function OrderReview({ cart, copy, language }) {
  const totalQty = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  return (
    <section className="order-review" data-testid="order-review">
      <header className="order-review-head">
        <span>{copy.reviewItemsTitle}</span>
        <b>
          {copy.totalCount} {totalQty}
          {copy.countSuffix}
        </b>
      </header>
      <div className="review-list">
        {cart.map((item) => {
          const menuName = item.menu.names[language] ?? item.menu.names.ko;
          const itemGroups = getMenuOptionGroups(item.menu);
          const optionLabels = [
            itemGroups.spice ? localizedOptionLabel("spice", item.spice, language) : "",
            itemGroups.size ? localizedOptionLabel("size", item.size, language) : "",
          ].filter(Boolean);
          const isCourse = item.menu.category === "course";
          const courseSequence = isCourse ? getCourseSequence(item.menu, language) : [];
          return (
            <div className={`review-item${isCourse ? " is-course" : ""}`} key={item.id}>
              <div className="review-item-row">
                <div>
                  <strong>{menuName}</strong>
                  {optionLabels.length > 0 && <span>{optionLabels.join(" · ")}</span>}
                  {item.requestMemo && <small>{item.requestMemo}</small>}
                </div>
                <b>
                  {item.quantity}
                  {language === "ko" ? "개" : language === "zh" ? "份" : " pcs"}
                </b>
                <strong className="review-item-price">{formatPrice(item.unitPrice * item.quantity, copy)}</strong>
              </div>
              {courseSequence.length > 0 && (
                <div className="review-course-summary">
                  <span>{copy.reviewCourseItems}</span>
                  <b>
                    {courseSequence.length}
                    {copy.countSuffix}
                  </b>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p>{copy.reviewHint}</p>
    </section>
  );
}

function OrderComplete({ copy, language, orderCode, orderStatus, orderedItems, total, courseStep = 0, courseRequest = null, onAdvance, onRequestNext, requestService, onReset }) {
  const statusIndex = orderStatusToProgressIndex[orderStatus] ?? 0;
  const courseItem = orderedItems.find((item) => item.menu.category === "course");
  return (
    <section className={courseItem ? "complete-panel has-course" : "complete-panel"} data-testid="order-complete">
      <div className="complete-left">
        <div className="complete-hero" role="status" aria-live="polite">
          <div className="complete-check" aria-hidden="true">
            <CheckCircle2 size={72} strokeWidth={2.2} />
          </div>
          <strong>{copy.orderTitle}</strong>
          <p>{copy.orderSubtitle}</p>
        </div>
        <div className="order-code-card" aria-label={copy.orderNumber}>
          <span>{copy.orderNumber}</span>
          <strong data-testid="order-code">#{orderCode}</strong>
        </div>
        {!courseItem && (
          <div className="complete-progress" aria-label={copy.progressLabel}>
            <ol className="progress-dots">
              {copy.progressSteps.map((label, idx) => (
                <li
                  className={`progress-dot${idx < statusIndex ? " done" : ""}${idx === statusIndex ? " active" : ""}`}
                  key={label}
                  aria-current={idx === statusIndex ? "step" : undefined}
                >
                  <i />
                  <small>{label}</small>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="order-meta-row">
          <div className="order-meta-cell">
            <span>{copy.estimatedTime}</span>
            <strong className="meta-eta">{copy.waitValue}</strong>
          </div>
          <div className="order-meta-cell">
            <span>{copy.paymentAmount}</span>
            <strong className="meta-amount">{total.toLocaleString()}{copy.unit}</strong>
          </div>
        </div>
        <div className="complete-actions">
          <button className="secondary-action" onClick={() => requestService(copy.smsAlert)} type="button">
            {copy.smsAlert}
          </button>
          <button className="primary-action large" onClick={onReset} type="button">
            {copy.newOrder}
          </button>
        </div>
        <p className="complete-thanks">{copy.thanksMessage}</p>
      </div>
      {courseItem && (
        <div className="complete-right">
          <CoursePanel copy={copy} course={courseItem.menu} language={language} courseStep={courseStep} courseRequest={courseRequest} onRequestNext={onRequestNext} />
        </div>
      )}
    </section>
  );
}

function CoursePanel({ copy, course, language, courseStep = 0, courseRequest = null, onRequestNext }) {
  const sequence = getCourseSequence(course, language);
  const total = sequence.length;
  if (total === 0) return null;
  const currentIdx = Math.min(total - 1, Math.max(0, courseStep));
  const isLast = currentIdx >= total - 1;
  const nextIdx = Math.min(total - 1, currentIdx + 1);
  const nextItem = sequence[currentIdx + 1];
  const isPreparing = Boolean(nextItem && courseRequest?.fromStep === currentIdx);
  const prepMinutes = getCoursePrepMinutes(course, nextIdx);
  const progressPct = total > 1 ? Math.round((currentIdx / (total - 1)) * 100) : 100;
  const requestTime = courseRequest?.requestedAt
    ? new Date(courseRequest.requestedAt).toLocaleTimeString(language === "ko" ? "ko-KR" : language === "zh" ? "zh-CN" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;
  const [debouncing, setDebouncing] = useState(false);

  useEffect(() => {
    if (!debouncing) return undefined;
    const id = setTimeout(() => setDebouncing(false), 800);
    return () => clearTimeout(id);
  }, [debouncing]);

  const handleAdvance = () => {
    if (debouncing || isLast) return;
    setDebouncing(true);
    onRequestNext?.();
  };

  return (
    <section className="course-panel" data-testid="course-panel">
      <header className="course-panel-head">
        <div>
          <span>{copy.coursePanelHeader}</span>
          <h3>{course.names[language]}</h3>
        </div>
        <strong aria-label={`${currentIdx + 1} / ${total}`}>{currentIdx + 1}/{total}</strong>
      </header>
      <div className="course-panel-progress" aria-label={`${copy.courseProgressPercent} ${progressPct}%`}>
        <div className="course-panel-progress-track">
          <i style={{ width: `${progressPct}%` }} />
        </div>
        <span>
          {currentIdx + 1} / {total} · {progressPct}%
        </span>
      </div>
      <div className={isPreparing ? "course-timing-card preparing" : "course-timing-card"} data-testid="course-timing-card">
        <div>
          <span>{copy.courseTimingTitle}</span>
          <strong>{nextItem ?? copy.courseEnd}</strong>
          <p>{isPreparing ? copy.courseTimingPreparing : copy.courseTimingIdle}</p>
        </div>
        {!isLast && (
          <dl>
            <div>
              <dt>{copy.coursePrepEstimateLabel}</dt>
              <dd>
                {prepMinutes}
                {copy.courseMinuteUnit}
              </dd>
            </div>
            {requestTime && (
              <div>
                <dt>{copy.courseRequestAtLabel}</dt>
                <dd>{requestTime}</dd>
              </div>
            )}
          </dl>
        )}
      </div>
      <div className="course-sequence-block">
        <span className="course-sequence-label">{copy.courseAllStepsLabel}</span>
        <ol className="course-panel-sequence">
          {sequence.map((item, idx) => {
            const state = idx < currentIdx ? "done" : idx === currentIdx ? "active" : idx === currentIdx + 1 && isPreparing ? "preparing" : idx === currentIdx + 1 ? "next" : "upcoming";
            return (
              <li className={state} key={`${item}-${idx}`} aria-current={state === "active" || state === "preparing" ? "step" : undefined}>
                <span className="seq-marker">
                  <i>{String(idx + 1).padStart(2, "0")}</i>
                </span>
                <div className="seq-copy">
                  <p>{item}</p>
                  {state === "done" && <small>{copy.courseStepDone}</small>}
                  {state === "active" && <small>{copy.courseEatingNow}</small>}
                  {state === "next" && <small>{copy.courseNextEta}</small>}
                  {state === "preparing" && (
                    <small>
                      {copy.courseStepPreparing} · {prepMinutes}
                      {copy.courseMinuteUnit}
                    </small>
                  )}
                  {state === "upcoming" && <small>{copy.courseStepQueued}</small>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <button
        className="primary-action large course-advance-cta"
        data-testid="course-advance"
        disabled={debouncing || isLast}
        onClick={handleAdvance}
        type="button"
      >
        {isLast ? copy.courseEnd : isPreparing ? copy.courseArrivalConfirm : `+ ${copy.courseRequestNext}`}
      </button>
    </section>
  );
}

function CourseProgress({ copy, course, language, onAdvance, statusIndex }) {
  const sequence = getCourseSequence(course, language);
  if (sequence.length === 0) return null;
  const currentIndex = Math.min(sequence.length - 1, statusIndex === 0 ? 0 : statusIndex === 1 ? 1 : statusIndex === 2 ? Math.max(2, Math.floor(sequence.length / 2)) : sequence.length - 1);
  const nextCourse = sequence[currentIndex + 1];
  const progress = sequence.length > 1 ? Math.round((currentIndex / (sequence.length - 1)) * 100) : 100;

  return (
    <section className="course-progress-card" data-testid="course-progress">
      <div className="course-progress-head">
        <span>{copy.courseProgressTitle}</span>
        <strong>{progress}%</strong>
      </div>
      <div className="course-progress-bar" aria-label={`${copy.courseProgressPercent} ${progress}%`}>
        <i style={{ width: `${progress}%` }} />
      </div>
      <div className="course-now-next">
        <div>
          <span>{copy.currentCourse}</span>
          <strong>{sequence[currentIndex]}</strong>
        </div>
        {nextCourse && (
          <div>
            <span>{copy.nextCourse}</span>
            <strong>{nextCourse}</strong>
          </div>
        )}
      </div>
      <ol className="course-mini-sequence">
        {sequence.map((item, index) => (
          <li className={index < currentIndex ? "done" : index === currentIndex ? "active" : ""} key={`${item}-${index}`}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <p>{item}</p>
          </li>
        ))}
      </ol>
      <button className="course-status-action" onClick={onAdvance} type="button">
        {copy.statusAdvance}
      </button>
    </section>
  );
}

// 운영 관제 — 준비 중 (주문·결제/운영 현황 탭 UI 제거, 추후 재오픈 예정)
function OwnerConsole() {
  return (
    <section className="surface-coming-soon" aria-live="polite">
      <div className="coming-soon-card">
        <span className="coming-soon-icon" aria-hidden="true">
          <Clock3 size={34} />
        </span>
        <span className="coming-soon-eyebrow">운영 관제</span>
        <h2>준비 중입니다</h2>
        <p>
          전 오토웍·주문·큐·재고·매출을 통합 관제하는 화면을 준비하고 있습니다.
          <br />
          빠른 시일 내에 제공할 예정입니다.
        </p>
      </div>
    </section>
  );
}
