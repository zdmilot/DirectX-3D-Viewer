using GalaSoft.MvvmLight;
using GalaSoft.MvvmLight.Ioc;
using HxLabwrCatTools.ViewModels;
using HxLabwrEd2.ViewModel;

namespace HxLabwrEd2.StaticHelpers;

public static class UnsavedDataHelper
{
	public static bool UnsavedDataPresent()
	{
		bool result = false;
		ViewModelBase displayedViewModel = SimpleIoc.Default.GetInstance<ApplicationViewModel>().DisplayedViewModel;
		if (displayedViewModel is CatManagerViewModel)
		{
			if (((CategoryTreeViewModel)(displayedViewModel as CatManagerViewModel).CategoryManagerVM).IsTreeDirty)
			{
				result = true;
			}
		}
		else if (displayedViewModel is CategoryFilterManagerViewModel)
		{
			CategoryFilterManagerViewModel categoryFilterManagerViewModel = displayedViewModel as CategoryFilterManagerViewModel;
			if (categoryFilterManagerViewModel.CategoriesDirty || categoryFilterManagerViewModel.FilterDirty)
			{
				result = true;
			}
		}
		else if (((object)displayedViewModel).GetType().IsSubclassOf(typeof(LoadedViewModelBase)))
		{
			LoadedViewModelBase loadedViewModelBase = displayedViewModel as LoadedViewModelBase;
			if (loadedViewModelBase.LoadedLabware.DataChanged && !loadedViewModelBase.LoadedLabware.ReadOnly)
			{
				result = true;
			}
		}
		return result;
	}
}
