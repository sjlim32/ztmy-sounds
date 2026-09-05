comment on view quiz_questions_public is
  '향후 문제 목록 브라우징 기능을 위해 남겨둔 뷰. 현재 anon/authenticated 권한이
  전면 회수되어 있어 무해하지만(009 테스트가 권한 0을 검증), 만약 다시 grant한다면
  이 SELECT에 and pool = ''practice'' 필터를 추가해 test_only 문제의 본문이
  노출되지 않도록 해야 한다.';
