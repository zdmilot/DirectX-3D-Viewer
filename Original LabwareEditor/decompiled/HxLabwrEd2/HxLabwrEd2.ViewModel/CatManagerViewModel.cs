using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Ioc;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrCatTools.ViewModels;
using HxLabwrCatTools.ViewModels.CategoryManager;
using HxLabwrEd2.StaticHelpers;

namespace HxLabwrEd2.ViewModel;

public class CatManagerViewModel : ViewModelBase
{
	private CategoryManagerViewModel categoryManagerVM;

	public CategoryManagerViewModel CategoryManagerVM
	{
		get
		{
			return categoryManagerVM;
		}
		set
		{
			((ObservableObject)this).Set<CategoryManagerViewModel>((Expression<Func<CategoryManagerViewModel>>)(() => CategoryManagerVM), ref categoryManagerVM, value);
		}
	}

	public RelayCommand CloseButton { get; }

	public CatManagerViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		CloseButton = new RelayCommand((Action)ExecuteCloseButton, false);
		Messenger.Default.Register<GenericMessage<bool>>((object)this, (object)"LoadLabwareCategoryManager", (Action<GenericMessage<bool>>)delegate(GenericMessage<bool> msg)
		{
			LoadCategoryManager(msg.Content);
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"CleanCategoryManagerVM", (Action<NotificationMessage>)delegate
		{
			CategoryManagerVM = null;
		}, false);
		Messenger.Default.Register<NotificationMessage>((object)this, (object)"CatManagerGenerateLabwareIndex", (Action<NotificationMessage>)delegate
		{
			CategoryManagerVM.GenerateLabwareIndexAsync();
		}, false);
	}

	private void LoadCategoryManager(bool partial)
	{
		//IL_000a: Unknown result type (might be due to invalid IL or missing references)
		//IL_0014: Expected O, but got Unknown
		if (CategoryManagerVM == null)
		{
			CategoryManagerVM = new CategoryManagerViewModel(partial);
		}
	}

	private void ExecuteCloseButton()
	{
		if (!((CategoryTreeViewModel)categoryManagerVM).IsTreeDirty || DialogWindowHelper.ShowDialogWithProportionalDimensions("Confirmation", (ViewModelBase)(object)SimpleIoc.Default.GetInstance<DialogUnsavedChangesViewModel>(), UnsavedChangesDialogExitText.PageExit, 0.4, 0.2) != false)
		{
			Messenger.Default.Send<GenericMessage<ViewModelBase>>(new GenericMessage<ViewModelBase>((ViewModelBase)(object)SimpleIoc.Default.GetInstance<TitlePageViewModel>()), (object)"Navigation");
			CategoryManagerVM = null;
		}
	}
}
