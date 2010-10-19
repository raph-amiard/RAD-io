$(function() {
  return $.fn.extend({
    disableTextSelect: function() {
      return this.each(function() {
        if ($.browser.mozilla) {
          $(this).css('MozUserSelect', 'none');
        } else if ($.browser.msie) {
          $(this).bind('selectstart', function() {
            return false;
          });
        } else if ($.browser.webkit) {
          $(this).css('-webkit-user-select', 'none');
          $(this).mousedown(function() {
            return false;
          });
        } else {
          $(this).mousedown(function() {
            return false;
          });
        }
        return this;
      });
    },
    make_selectable: function(opts) {
      var container, defaults;
      defaults = {
        handler: undefined,
        unique_select: false,
        select_class: 'ui-selected'
      };
      opts = $.extend(defaults, opts);
      container = this;
      this.children().click(function(e) {
        if (opts.unique_select) {
          if (!$(this).hasClass(opts.select_class)) {
            container.children().removeClass(opts.select_class);
            $(this).addClass(opts.select_class);
          }
        } else {
          $(this).toggleClass(opts.select_class);
        }
        return opts.handler ? opts.handler(e) : undefined;
      });
      return this.children().disableTextSelect();
    },
    renderTemplate: function(template_name, context) {
      return this.html(new EJS({
        url: js_template(template_name)
      }).render(context));
    }
  });
});