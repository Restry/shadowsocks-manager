var currentUser;

function showAlert(msg, type) {
    $(".alert span").text(msg);
    var $alert = $(".alert");
    if (type === 'success') {
        $alert.addClass("success");
    } else {
        $alert.removeClass("success");
    }
    $alert.show();
    setTimeout(function () {
        $alert.hide();
    }, 1500);
}

function initModals() {
    $("#button-apply").on('click', function () {
        if (currentUser && currentUser.vip >= 2) {
            $("#modal-apply").show();
        } else {
            $("#modal-upgrade").show();
        }
    });
    $(".modal-container").on('click', function(e) {
        if (e.target === e.currentTarget) {
            if ($(this).parents("#modal-save").length > 0) {
                if (!confirm("确定已保存 LICENSE 内容？")) {
                    return;
                }
            }
            $(this).parent().hide();
        }
    });
    $(".modal-close-btn").on('click', function () {
        if ($(this).parents("#modal-save").length > 0) {
            if (!confirm("确定已保存 LICENSE 内容？")) {
                return;
            }
        }
        $(this).parents('.modal-container').parent().hide();
    });
    if (Clipboard.isSupported()) {
        var clipboard = new Clipboard("#modal-save .copy", {
            target: function (trigger) {
                return trigger.nextElementSibling;
            }
        });
        clipboard.on('success', function (e) {
            e.clearSelection();
            showAlert("已复制", "success")
        });
    } else {
        $("#modal-save .copy").remove();
    }
}

function validateForm() {
    var $company = $("#company"),
        $domain = $("#domain"),
        $contact = $("#contact"),
        $email = $("#email"),
        $phone = $("#phone"),
        $terms = $("#terms");

    if ($company.val() === '') {
        $company.focus();
        return false;
    }
    if ($domain.val() === '') {
        $domain.focus();
        return false;
    }
    if ($contact.val() === '') {
        $contact.focus();
        return false;
    }
    if ($email.val() === '') {
        $email.focus();
        return false;
    }
    if ($phone.val() === '') {
        $phone.focus();
        return false;
    }
    if (!$terms.is(":checked")) {
        showAlert("请阅读并同意《Coding Enterprise 私有云使用协议》");
        return false;
    }
    return {
        company: $company.val(),
        domain: $domain.val(),
        seats: $("input[name=seats]:checked").val(),
        contact: $contact.val(),
        email: $email.val(),
        phone: $phone.val(),
        terms: $terms.is(":checked") ? 1 : 0
    };
}

function formatDate(unixTimeMills) {
    var d = new Date(unixTimeMills);
    return d.getFullYear() + " 年 " + (d.getMonth()+1) + " 月 " + d.getDate() + " 日";
}

function showLicense(resp) {
    $("#modal-save").find("pre code").text(resp.license);
    $("#modal-save").find("company").text(resp.company);
    $("#modal-save").find("domain").text(resp.domain);
    $("#modal-save").find("seat").text(resp.seats + " 人");
    $("#modal-save").find("expire").text(formatDate(resp.expire_at));
    $("#modal-save").show();
}

function updateUser(user) {
    currentUser = user;
    $(".brand .avatar img").attr("src", user.avatar);
    $("#email").val(user.email);
    $("#phone").val(user.phone);
    $(".brand .avatar").show();
}

function checkLogin() {
    $.getJSON("user", function (resp) {
        if (resp.code === 0) {
            updateUser(resp.data);
        } else {
            $("#button-apply").hide();
            $("#button-login").show();
        }
    });
}

function bindForm() {
    $("#form-apply").submit(function(e) {
        e.preventDefault();
        var data = validateForm();
        if (!data) {
            return;
        }
        $.ajax({
                   type: "POST",
                   url: "evaluate",
                   data: data,
                   dataType: 'json',
                   success: function (resp) {
                       $("#modal-apply").hide();
                       if (resp.license && resp.license !== '') {
                           showLicense(resp);
                       } else {
                           if (resp.code === 401) {
                               $("#modal-upgrade").show();
                           } else {
                               $("#modal-notice").find(".modal-header").text(resp.error);
                               $("#modal-notice").show();
                           }
                       }
                   },
                   error: function (xhr) {
                       showAlert("code " + xhr.status, + ": " + xhr.statusText);
                   }
               });
    });
}
$(function(){
    checkLogin();
    initModals();
    bindForm();
});
