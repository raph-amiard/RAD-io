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
    $.extend($.fn.make_selectable = function (opts) {
        opts = $.extend({
            handler: undefined,
            unique_select: false,
            select_class: 'ui-selected'
        }, opts);
        var container = this;
        this.children().click(function(e) {
            if(opts.unique_select) {
                if(!$(this).hasClass(opts.select_class)) {
                    container.children().removeClass(opts.select_class);
                    $(this).addClass(opts.select_class);
                }
            } else {
                $(this).toggleClass(opts.select_class);
            }
            if(opts.handler) {opts.handler(e);}
        });
        this.children().disableTextSelect();
    });
});
