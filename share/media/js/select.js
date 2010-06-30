$(function() {
    $.extend($.fn.disableTextSelect = function() {
        return this.each(function(){
            if($.browser.mozilla){//Firefox
                $(this).css('MozUserSelect','none');
            } else if ($.browser.msie){//IE
                $(this).bind('selectstart',function(){return false;});
            } else if ($.browser.webkit) {
                $(this).css('-webkit-user-select', 'none');
                $(this).mousedown(function(){return false;});
            } else {//Opera, etc.
                $(this).mousedown(function(){return false;});
            }
        });
    });
    $.extend($.fn.make_selectable = function (handler) {
        this.children().disableTextSelect();
        this.children().click(function(e) {
            $(this).toggleClass('ui-selected');
            if(handler) {handler(e);}
        });
    });
});
