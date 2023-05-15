// ==UserScript==
// @name         cunhua
// @namespace    https://cunhua.click/
// @version      1.0
// @description  cunhua
// @author       You
// @match        https://cunhua.click/*
// @match        https://www.cunhua.click/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=cunhua.click
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    async function fetch_real_url(url) {
        const resp = await fetch(url);
        const html = await resp.text();
        let [, jsStr] = /<script.*?>([\s\S]*?)<\/script>/gm.exec(html);
        const temp = `
        MuURL='';
        MuObj={
            href:'',replace:function(abc){MuURL=abc},
            assign:function(abc){MuURL=abc},
        };` ;
        jsStr = temp + jsStr.replaceAll('location', 'MuObj');
        //console.log(jsStr);
        let func = new Function(jsStr);
        func();
        MuURL = MuURL ? MuURL : (MuObj.href || MuObj);
        let [, _dsign] = /_dsign=(.*)/gm.exec(MuURL);
        const _url = url + '&_dsign=' + _dsign;
        return _url;
    }

    async function get_images(url) {
        //console.log(url);
        const real_url = await fetch_real_url(url);
        const resp = await fetch(real_url);
        const html = await resp.text();
        let regex = /<img[^>]+id="aimg_\d+"[^>]*>/g;
        let matches = html.match(regex);
        return matches.map((v) => { return $(v).attr('src'); });
        // const urls = $(html).find('.message a>img')
        //     .map(function () {
        //         return $(this).attr('src');
        //     }).get();
        // return urls;
    }

    function preLoadImg(id, url) {
        console.log("preLoadImg",id,url);
        var img = new Image();
        img.src = url;
        img.onload = function () {
            document.getElementById(id).src = url;
        };
        img.onerror = function () {
            document.getElementById(id).src = "https://www.cunhua.click/template/bygsjw/image/logo.png";
        }
    }

    $('.threadlist li>a:first-child').each(async function (index, vo) {
        let container = $(this).parent().append(`<div class="img-list" style="width: 100%; height:200px;padding-top:10px;overflow-x: auto; overflow-y: hidden; white-space: nowrap;"></div>`);
        const defaultImg = "https://jsonp.gitee.io/img/load.gif";
        let i = 0;
        while (i++ < 2) {
            container.find(".img-list").append(`<img src="${defaultImg}" id="id_${index}_img_${i - 1}" style="height: 200px; display: inline-block;padding:0 5px"/>`);
        }
        let url = $(this).attr('href');
        const links = await get_images('https://' + location.host + '/' + url);
        console.log(url, index, links);
        let count = links.length;
        $(this).find('p').append(`<b>[${count}P]</b>`);
        links.slice(0, 2).forEach((link, _index) => {
            const dom_id = `id_${index}_img_${_index}`;
            $(`#${dom_id}`).attr('data-src', link);
        });
        lazyLoad(); 
    });

    function debounce(fn, delay) {
        let timer;
        return function() {
          const context = this;
          const args = arguments;
          clearTimeout(timer);
          timer = setTimeout(() => {
            fn.apply(context, args);
          }, delay);
        };
      }

    function lazyLoad() {
        const lazyImages = document.querySelectorAll('img[data-src]');
        lazyImages.forEach(img => {
            const imgTop = img.getBoundingClientRect().top;
            const imgBottom = img.getBoundingClientRect().bottom;
            const winTop = window.innerHeight;
            if (imgTop < winTop && imgBottom >= 0) {
                preLoadImg(img.id,img.dataset.src);
                img.removeAttribute('data-src');
            }
        });
    }
    const lazyLoadDebounced = debounce(lazyLoad, 100);
    window.addEventListener('scroll', lazyLoadDebounced);
})();