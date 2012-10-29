﻿//var _this = this;

osm.poi = {
  i18n: {},
  // layers:{},
  opt:{

  },

  initialize: function() {
    osm.poi.layer = new L.LayerGroup();
    osm.map.addLayer(osm.poi.layer);
    osm.poi.tree=$('#leftpoispan div.contentpan')
      .jstree({
        "plugins" : ["json_data", "checkbox","ui"],
        "json_data" : {
          "ajax" : {
            "type": 'GET',
            "url": "data/poidatatree.json"
          }
        },
        "checkbox": {
          "override_ui": true
        }
      })
      .bind("change_state.check_box.jstree", function (event, data) {
        osm.poi.updateMarkerTree(false);
      })
  },

  enable: function() {
    //osm.map.addLayer(this.layer);
    this.opt.on=true;
    osm.map.on('moveend', osm.poi.updateMarkerTree);
    // osm.map.on('popupopen', osm.poi.bindOpenPopup);
    // osm.map.on('popupclose', osm.poi.bindClosePopup);
  },

  disable: function() {
    this.opt.on=false;
    //osm.map.removeLayer(this.layer);
    osm.map.off('moveend',this.updateMarkerTree);
    // osm.map.off('popupopen', osm.poi.bindOpenPopup);
    // osm.map.off('popupclose', osm.poi.bindClosePopup);
  },

  updateMarkerTree: function(){
    var move = false;
    if (arguments[0].type=="moveend"){move=true}
    var checked=$('.jstree-checked.jstree-leaf', osm.poi.tree );
    var nclass=[];
    for (i=0;i<checked.length;i++) {
      nclass.push(checked[i].attributes['nclass'].nodeValue);
    }
    nclass=nclass.join(',');
    var bounds = osm.map.getBounds();
    var sw = bounds.getSouthWest(), ne = bounds.getNorthEast();
    $.getJSON('/api/poi', {action:"getpoibbox", nclass:nclass, t:ne.lat, r:ne.lng, b:sw.lat, l:sw.lng},
      function(results){
        markers={};
        for (item1 in osm.poi.layer._layers){
          markers[$(osm.poi.layer._layers[item1]._popup._content,'div.poi_popup').attr('id')]=osm.poi.layer._layers[item1]
        }
        //osm.poi.layer.clearLayers();
        for (item2 in results.data){
          if (markers[results.data[item2].id]){
            delete markers[results.data[item2].id];
          }
          else{
            icon_url = 'img/poi_marker/'+results.data[item2].nclass+'.png';
            _marker = new L.Marker(new L.LatLng(results.data[item2].lat, results.data[item2].lon), {icon:new osm.poi.osbIcon({iconUrl: icon_url})});
            _marker.bindPopup(osm.poi.createPopupText(results.data[item2]));
            osm.poi.layer.addLayer(_marker);
          }
        }
        for (item3 in markers){
          osm.map.removeLayer(markers[item3]);
          delete osm.poi.layer._layers[markers[item3]._leaflet_id];
        }

      })
    .error(
      function(jqXHR, textStatus, errorThrown){
        console.log('Ошибка: ' + textStatus + '<br />' + errorThrown.message);
      });
  },
  osbIcon :  L.Icon.extend({
		options: {
			iconUrl: 'img/marker-icon.png',
			iconSize: new L.Point(31, 31),
			shadowSize: new L.Point(0, 0),
			iconAnchor: new L.Point(16, 30),
			popupAnchor: new L.Point(0, -11)
		}
	}),


  createPopupText: function(getdata) {
    if (!(getdata == null)) {
      var operator;
      if (!(getdata.operator==null)) {
        operator=$('<tr>').addClass('poi_operator')
          .append($('<td>').text('Владелец: '))
          .append($('<td>').text(getdata.operator).addClass('poi_value'))
      }
      var brand;
      if (!(getdata.brand==null)) {
        brand=$('<tr>').addClass('poi_brand')
          .append($('<td>').text('Бренд: '))
          .append($('<td>').text(getdata.brand).addClass('poi_value'))
      }
      var phone;
      if (!(getdata.phone==null)) {
        phone=$('<tr>').addClass('poi_phone')
          .append($('<td>').text('Телефон: '))
          .append($('<td>').text(getdata.phone).addClass('poi_value'))
      }
      var fax;
      if (!(getdata.fax==null)) {
        fax=$('<tr>').addClass('poi_fax')
          .append($('<td>').text('Факс: '))
          .append($('<td>').text(getdata.fax).addClass('poi_value'))
      }
      var website;
      if (!(getdata.website==null)) {
        website=$('<tr>').addClass('poi_website')
          .append($('<td>').text('Web-сайт: '))
          .append($('<td>').text(getdata.website).addClass('poi_value'))
      }

      var moretags;
      for (xName in getdata.tags_ru) {
        moretags=$('<tr>').addClass('poi_moretags')
          .append($('<td>').text(xName+': '))
          .append($('<td>').text(getdata.tags_ru[xName]))
      }

      ret = $('<div>').addClass('poi_popup').attr('id',getdata.id)
        .append($('<p>').addClass('poi_header')
          .append($('<span>').text(getdata.class_ru).addClass('poi_name'))
          .append($('<span>').text(getdata.name_ru||'').addClass('poi_value'))
        )
        .append($('<table>')
          .append($('<tr>').addClass('poi_opening_hours')
            .append($('<td>').text('Время работы: '))
            .append($('<td>').text(getdata.opening_hours||osm.poi.opt.nulldisplay).addClass('poi_value'))
          )
          .append($('<tr>').addClass('poi_addr')
            .append($('<td>').text('Адрес: '))
            .append($('<td>').text(getdata.addr_full_name||"").addClass('poi_value'))
          )
          .append(operator)
          .append(brand)
          .append(phone)
          .append(fax)
          .append(website)
          .append(moretags)
        )

      return ret[0].outerHTML;
    }
  },

  createPopup: function(id, marker) {
    marker.bindPopup($('<img src="/img/loader.gif">')[0].outerHTML);
    $.getJSON("/api/poi", {action: 'getpoiinfo', id: id}, function(json){
      if (!(json.data == null)) {

        textP = osm.poi.createPopupText(json.data);

        isopen=osm.map.hasLayer(marker._popup);
        if (isopen) {marker.closePopup();}
        marker.bindPopup(textP,{maxWidth:400});
        if (isopen) {marker.openPopup();}
      }
    })
  },
  
  bindOpenPopup: function(){
    osm.poi.openpopup=arguments[0].popup;
  },
  bindClosePopup: function(){
    delete osm.poi.openpopup;
  }

}

osm.poi.opt={
  on: false,
  nulldisplay: "Неизвестно"
}
