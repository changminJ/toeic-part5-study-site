window.TOEIC_PART1 = {
  title: "TOEIC Part 1 전략 모아보기",
  subtitle: "사진 예측, 8가지 문장 구조, 배경별 단어 묶음, 듣기 복습 루틴.",
  parts: [
    {
      key: "predict",
      marker: "3s",
      title: "3초 사진 예측",
      goal: "보기가 나오기 전에 사진에서 출제될 단어를 먼저 떠올린다. 한국어로 아는 것이 아니라 영어 표현이 바로 떠올라야 한다.",
      blocks: [
        {
          title: "보는 순서",
          type: "list",
          items: [
            "사람이 있으면 동작부터 본다: holding, carrying, typing, reaching for, facing each other.",
            "사람이 없으면 사물 이름과 위치를 먼저 본다: shelves, railing, platform, dock, pier.",
            "배경은 묶어서 예측한다: 사무실, 식당, 주방, 공사장, 식료품점, 실험실, 발표장, 항구.",
            "사진에 없는 단어가 들리면 제거한다. Part 1은 정답 찾기보다 오답 제거가 빠르다."
          ]
        },
        {
          title: "상태와 동작",
          type: "table",
          rows: [
            ["표현", "뜻", "판단"],
            ["wearing", "입고/착용한 상태", "이미 착용 중이면 정답 후보"],
            ["putting on", "착용하는 동작", "입거나 쓰는 순간이 보여야 함"],
            ["holding", "손에 쥐고 있음", "서류, 펜, 컵, 전화기"],
            ["carrying", "들고 이동함", "상자, 가방, 사다리, 목재"],
            ["seats are occupied", "좌석이 차 있음", "사람들이 앉아 있는 사진"]
          ]
        }
      ]
    },
    {
      key: "structures",
      marker: "8",
      title: "8가지 문장 구조",
      goal: "Part 1 문장은 구조가 반복된다. 문법 이름보다 듣자마자 어떻게 해석할지 고정한다.",
      blocks: [
        {
          title: "구조표",
          type: "table",
          rows: [
            ["구조", "해석", "주의"],
            ["S is/are V-ing", "S가 V하고 있다", "사람뿐 아니라 사물 주어도 가능"],
            ["S is/are p.p.", "S가 p.p.되어 있다", "covered, displayed, mounted, seated"],
            ["S is/are being p.p.", "S가 p.p.되는 중이다", "실제 동작 수행자가 보여야 함"],
            ["S is/are + 보충설명", "S의 상태·위치", "empty, on display, on the counter"],
            ["S + V", "S가 V한다", "a path leads to / an arch covers"],
            ["S has/have been p.p.", "p.p.된 상태", "has been filled/hung/left open"],
            ["There is/are S", "S가 있다", "무엇이 어디에 있는지 우선"],
            ["There is/are S V-ing/p.p.", "V-ing/p.p. 상태의 S가 있다", "cups stacked / fence surrounding"]
          ]
        },
        {
          title: "진행 수동 소거",
          type: "list",
          items: [
            "being cleaned, being repaired, being cut은 누군가 청소·수리·절단하는 장면이 보여야 한다.",
            "사람 없는 계단, 지붕, 나무 사진에서 being p.p.가 들리면 우선 의심한다.",
            "has been p.p.는 Part 1에서 상태 묘사로 빠르게 처리한다."
          ]
        }
      ]
    },
    {
      key: "backgrounds",
      marker: "bg",
      title: "배경별 단어 묶음",
      goal: "낱개 단어보다 배경별로 묶어 외우면 사진을 보는 순간 정답 후보가 빨리 열린다.",
      blocks: [
        {
          title: "빈출 배경",
          type: "table",
          rows: [
            ["배경", "우선 표현"],
            ["거리·건물", "traffic light, vehicle, crosswalk, pedestrian, overlook"],
            ["정원·마당", "rake, fallen leaves, basket, wearing gloves, lumber, mowing the lawn"],
            ["사무실", "potted plants, water bottle, monitor, holding, typing, facing each other"],
            ["식당", "seats are occupied, server, having a conversation, pouring, apron"],
            ["주방", "light fixture, refrigerator, produce, faucet, counter, cookware, microwave"],
            ["공사장", "scaffolding, safety helmet, safety vest, clipboard, wood plank"],
            ["식료품점", "shelves, merchandise, items, products, pushing a shopping cart, aisle"],
            ["실험실", "microscope, peering into, adjusting, laboratory, lab coat"],
            ["발표장", "delivering a speech, presentation, documents, mounted, chart, screen"],
            ["항구·물가", "floating on the water, docked, tied, reflected on the water, dock, pier, harbor"]
          ]
        }
      ]
    },
    {
      key: "review",
      marker: "ear",
      title: "듣기 복습",
      goal: "읽으면 되는데 들으면 안 되는 문제는 단어 뜻이 아니라 발음, 연음, 의미 단위 처리 속도의 문제다.",
      blocks: [
        {
          title: "오답 원인",
          type: "table",
          rows: [
            ["원인", "증상", "처리"],
            ["단어", "대본을 봐도 뜻을 모름", "단어장에 추가하고 발음까지 확인"],
            ["구조", "단어는 아는데 문장 해석이 느림", "8가지 구조 중 하나로 분류"],
            ["발음", "대본을 보면 아는 단어인데 못 들음", "그 단어만 다시 듣기"],
            ["연음", "단어 사이가 붙어서 낯설게 들림", "붙은 구간만 표시"],
            ["속도", "문장 끝나고 나서야 의미가 잡힘", "의미 덩어리 단위로 딕테이션"]
          ]
        },
        {
          title: "5분 루틴",
          type: "list",
          items: [
            "사진 1장당 영어 표현 5개를 먼저 떠올린다.",
            "보기 4개를 듣고 사진에 없는 단어를 제거한다.",
            "틀린 문제는 단어, 구조, 발음·연음·속도 중 하나로 표시한다.",
            "안 들린 문장은 긴 쉐도잉보다 의미 단위 딕테이션으로 처리한다.",
            "Part 1은 감 유지용이다. 오래 붙잡지 말고 Part 2와 Part 3/4로 넘어간다."
          ]
        }
      ]
    }
  ]
};
