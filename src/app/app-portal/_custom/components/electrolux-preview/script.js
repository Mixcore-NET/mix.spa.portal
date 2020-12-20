modules.component("electroluxPreview", {
  templateUrl:
    "/app/app-portal/_custom/components/electrolux-preview/view.html",
  controller: [
    "$rootScope",
    "$scope",
    "RestAttributeSetDataElectroluxService",
    function ($rootScope, $scope, dataService) {
      var ctrl = this;
      ctrl.isInRole = $rootScope.isInRole;
      ctrl.isInRoles = $rootScope.isInRoles;
      ctrl.canSendSMS = function () {
        return (
          ctrl.register &&
          (ctrl.register.obj.status == "Invalid" ||
            ctrl.register.obj.status == "Reject")
        );
      };
      ctrl.changeStatus = async function (status) {
        $rootScope.showConfirm(
          ctrl,
          "changeStatusConfirmed",
          [status],
          null,
          "Change Status",
          `Bạn có chắc chắn thay đổi trạng thái hồ sơ sang ${status}?`
        );
      };

      ctrl.changeStatusConfirmed = async function (status) {
        $rootScope.isBusy = true;
        ctrl.register.obj.status = status;
        var save = await dataService.saveValues(ctrl.register.id, {
          status: ctrl.register.obj.status,
          sms_status: null,
        });
        if (save.isSucceed) {
          $("#dlg-electrolux-preview").modal("hide");
          $rootScope.alert("Thành công");
          ctrl.callback({ pageIndex: 0 });
          $rootScope.isBusy = false;

          $scope.$apply();
        } else {
          $rootScope.showErrors(save.errors);
          $rootScope.isBusy = false;
          $scope.$apply();
        }
      };
      ctrl.sendSMS = async function () {
        var result = await dataService.sendSMS(ctrl.register.obj);
        if (result.isSucceed) {
          $rootScope.alert("Thành công");
          $rootScope.isBusy = false;
          $scope.$apply();
        } else {
          $rootScope.showErrors(save.errors);
          $rootScope.isBusy = false;
          $scope.$apply();
        }
      };
      ctrl.saveNotes = async function () {
        var save = await dataService.saveValues(ctrl.register.id, {
          admin_notes: ctrl.register.obj.admin_notes,
        });
        if (save.isSucceed) {
          // $("#dlg-electrolux-preview").modal("hide");
          $rootScope.alert("Thành công");
          $rootScope.isBusy = false;
          $scope.$apply();
        } else {
          $rootScope.showErrors(save.errors);
          $rootScope.isBusy = false;
          $scope.$apply();
        }
      };
    },
  ],
  bindings: {
    register: "=",
    callback: "&",
  },
});
