(function(){
"use strict";
window.VDM_CONTENT_DATA.browser={home:"vdm://city.local/"};
window.VDM_CONTENT_DATA.sites={
  "city.local":{
    preset:"agency",name:"青波市",
    navigation:[
      {label:"くらし",route:"vdm://city.local/services"},
      {label:"お知らせ",route:"vdm://city.local/notices"}
    ],
    pages:{
      "/":{title:"市民資料室の利用案内",department:"文化資料課",publishedAt:"2026年7月2日",notice:"7月15日は設備点検を行います。",services:[{title:"利用登録",description:"窓口で申請"},{title:"資料を探す",description:"分類から確認"}],notices:[{title:"開室日を更新",date:"7月2日"}],documents:[{title:"利用統計",description:"PDF 18ページ"}],contact:"文化資料課",updates:[{title:"開室日を修正",date:"2026.07.02"}]},
      "/services":{title:"市民サービス",department:"市民窓口",publishedAt:"2026年7月1日",services:[{title:"資料室",description:"資料の閲覧と複写"}],contact:"市民窓口"},
      "/notices":{title:"お知らせ",department:"広報課",publishedAt:"2026年7月12日",notices:[{title:"資料展を開催",date:"7月15日"}],contact:"広報課"},
      "/empty":{title:"公開資料",department:"文化資料課",services:[],notices:[],documents:[],contact:"文化資料課"},
      "/missing":{title:"ページが見つかりません",status:"404",department:"青波市"}
    }
  }
};
})();
