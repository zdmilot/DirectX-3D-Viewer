using System;
using System.Linq.Expressions;
using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Command;
using GalaSoft.MvvmLight.Messaging;
using HxLabwrCatTools.ViewModels;
using HxLabwrEd2.DialogWindows;
using HxLabwrEd2.Model;

namespace HxLabwrEd2.ViewModel;

public class DialogCategoriesViewModel : DialogViewModelBase
{
	private CategoryAssignerViewModel categoryAssignerVM;

	private Labware loadedLabware;

	private bool readOnly;

	public CategoryAssignerViewModel CategoryAssignerVM
	{
		get
		{
			return categoryAssignerVM;
		}
		set
		{
			((ObservableObject)this).Set<CategoryAssignerViewModel>((Expression<Func<CategoryAssignerViewModel>>)(() => CategoryAssignerVM), ref categoryAssignerVM, value);
		}
	}

	public bool ReadOnly
	{
		get
		{
			return readOnly;
		}
		set
		{
			((ObservableObject)this).Set<bool>((Expression<Func<bool>>)(() => ReadOnly), ref readOnly, value);
		}
	}

	public DialogCategoriesViewModel()
	{
		//IL_0014: Unknown result type (might be due to invalid IL or missing references)
		//IL_001e: Expected O, but got Unknown
		//IL_002c: Unknown result type (might be due to invalid IL or missing references)
		//IL_0036: Expected O, but got Unknown
		base.CancelCloseButton = new RelayCommand((Action)ExecuteCancelCloseButton, false);
		base.SaveButton = new RelayCommand((Action)ExecuteSaveButton, false);
		Messenger.Default.Register<GenericMessage<Labware>>((object)this, (object)"DialogCategoriesSetup", (Action<GenericMessage<Labware>>)delegate(GenericMessage<Labware> msg)
		{
			SetupLoadedLabware(msg.Content);
		}, false);
	}

	~DialogCategoriesViewModel()
	{
		try
		{
			Messenger.Default.Unregister((object)this);
		}
		finally
		{
			((object)this).Finalize();
		}
	}

	private void SetupLoadedLabware(Labware loadedLabware)
	{
		//IL_0008: Unknown result type (might be due to invalid IL or missing references)
		//IL_0012: Expected O, but got Unknown
		this.loadedLabware = loadedLabware;
		CategoryAssignerVM = new CategoryAssignerViewModel();
		categoryAssignerVM.AssignCategoryList(loadedLabware.CategoryIds);
		categoryAssignerVM.IsDirty = false;
		categoryAssignerVM.IsReadOnly = loadedLabware.ReadOnly;
		ReadOnly = loadedLabware.ReadOnly;
	}

	private void ExecuteCancelCloseButton()
	{
		InvokeRequestCloseDialog(new RequestCloseDialogEventArgs(dialogresult: false));
		CleanupReferences();
	}

	private void ExecuteSaveButton()
	{
		if (CategoryAssignerVM.IsDirty)
		{
			loadedLabware.CategoryIds.Clear();
			foreach (int categoryIds in CategoryAssignerVM.CategoryIdsList)
			{
				loadedLabware.CategoryIds.Add(categoryIds);
			}
		}
		InvokeRequestCloseDialog(new RequestCloseDialogEventArgs(dialogresult: true));
		CleanupReferences();
	}

	private void CleanupReferences()
	{
		loadedLabware = null;
		CategoryAssignerVM = null;
	}
}
