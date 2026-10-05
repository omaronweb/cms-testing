jQuery(document).ready(function($) {

    function urlMediaUploaderAddUrlInputIfNeeded() {
        var uploaderSection = $('.media-frame-content .upload-ui');
        if ($('#url-media-uploader-section').length === 0) {
            var urlUploadHtml = '<div id="url-media-uploader-section">' +
                '<p class="upload-instructions drop-instructions">' + urlMediaUploaderI18n.or + '</p>' +
                '<label for="url-media-uploader-input">' + urlMediaUploaderI18n.uploadFromUrl + '</label>' +
                '<div class="url-media-uploader-input-wrapper">' +
                '<input type="text" id="url-media-uploader-input" autocomplete="off" style="width: 100%;" placeholder="' + urlMediaUploaderI18n.enterUrlPlaceholder + '">' +
                '<button id="url-media-uploader-button" class="button">' + urlMediaUploaderI18n.uploadButton + '</button>' +
                '</div>' +
                '</div>';
            uploaderSection.append(urlUploadHtml);
        }
    }

    var observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.attributeName === 'class') {
                var target = $(mutation.target);
                if (target.find('.upload-ui')) {
                    $("#url-media-uploader-section").remove();
                    urlMediaUploaderAddUrlInputIfNeeded();
                }
            }
        });
    });

    var config = { attributes: true, subtree: true, attributeFilter: ['class'] };
    observer.observe(document.body, config);

    $(window).on('load', urlMediaUploaderAddUrlInputIfNeeded);

    $('body').on('click', '#url-media-uploader-button', function() {
        var button = $(this);
        var mediaUrlInput = button.closest("#url-media-uploader-section").find('#url-media-uploader-input');
        var mediaUrl = encodeURI(mediaUrlInput.val());
        var uploadKey = 'u' + Date.now();

        mediaUrlInput.prop('disabled', true);
        button.attr('disabled', true).append('<span class="spinner is-active" style="float: none;"></span>');

        var msg = $('<p class="upload-progress-message" style="color: #0073aa; margin-top: 10px;">' + urlMediaUploaderI18n.uploadingMessage + '</p>');
        button.closest("#url-media-uploader-section").append(msg);

        $.ajax({
            url: urlMediaUploader.ajax_url,
            type: 'POST',
            data: {
                action: 'url_media_uploader_url_upload',
                url: mediaUrl,
                upload_key: uploadKey,
                nonce: urlMediaUploader.nonce
            },
            success: function(response) {
                msg.remove();
                if (response.success) {
                    var attachmentId = response.data.attachment_id;
                    wp.media.attachment(attachmentId).fetch().then(function() {
                        let frame = (wp.media.frame === undefined) ? wp.media.frames.file_frame : wp.media.frame;
                        var selection = frame.state().get('selection');
                        var attachment = wp.media.attachment(attachmentId);
                        selection.add(attachment);

                        if(frame.content.get() !== null) {
                            frame.content.get().collection.props.set({ignore: (+ new Date())});
                        } else {
                            frame.library.props.set ({ignore: (+ new Date())});
                        }
                    });
                    button.closest('.media-modal-content').find('#menu-item-browse').click();

                } else {
                    alert(response.data.message);
                }
                mediaUrlInput.prop('disabled', false);
                button.attr('disabled', false).find('.spinner').remove();
            },
            error: function() {
                // On timeout/error, start background checking
                msg.text(urlMediaUploaderI18n.checkingMessage);
                checkStatus(uploadKey, button, input, msg);
            }
        });
    });

    function handleSuccess(attachmentId, button) {
        wp.media.attachment(attachmentId).fetch().then(function() {
            var frame = wp.media.frame || wp.media.frames.file_frame;
            var selection = frame.state().get('selection');
            selection.add(wp.media.attachment(attachmentId));
            if (frame.content.get() !== null) {
                frame.content.get().collection.props.set({ignore: (+new Date())});
            } else {
                frame.library.props.set({ignore: (+new Date())});
            }
        });
        button.closest('.media-modal-content').find('#menu-item-browse').click();
    }

    function checkStatus(uploadKey, button, input, msg) {
        var checks = 0;
        var interval = setInterval(function() {
            checks++;
            if (checks > 5) { // Stop after 5 checks (10 minutes)
                clearInterval(interval);
                msg.remove();
                input.prop('disabled', false);
                button.attr('disabled', false).find('.spinner').remove();
                return;
            }
            $.post(urlMediaUploader.ajax_url, {
                action: 'url_media_uploader_check_status',
                upload_key: uploadKey,
                nonce: urlMediaUploader.check_nonce
            }, function(response) {
                if (response.success && response.data.status === 'completed') {
                    clearInterval(interval);
                    msg.remove();
                    handleSuccess(response.data.attachment_id, button);
                    input.prop('disabled', false);
                    button.attr('disabled', false).find('.spinner').remove();
                } else if (!response.success) {
                    clearInterval(interval);
                    alert(response.data.message || urlMediaUploaderI18n.uploadFailedMessage);
                    msg.remove();
                    input.prop('disabled', false);
                    button.attr('disabled', false).find('.spinner').remove();
                }
            });
        }, 120000); // Check every 2 minutes
    }

});