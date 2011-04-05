(function() {
   tinymce.create('tinymce.plugins.ImageUploadPlugin', {
       /*
        * Image upload plugin definition
        */

       init : function(ed, url) {

           ed.addCommand('mceImageUpload', function() {
               /*
                * The actual upload_image command
                */
               ed.windowManager.open({
                   file : ed.getParam('imageupload_url'),
                   width : 480,
                   height : 385
               }, {
                   plugin_url : url
               });
           });


           ed.addButton('imageupload', {
               /*
                * Register button
                */
               title : 'imageupload.image_desc',
               cmd : 'mceImageUpload',
               image : url + '/img/imageupload.gif'
           });


       },

       getInfo : function () {
           return {
               longname: 'Image Upload',
               author: 'Raphael Amiard'
           };
       }
   });

   tinymce.PluginManager.add('imageupload', tinymce.plugins.ImageUploadPlugin);
})();
