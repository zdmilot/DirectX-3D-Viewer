using System;
using System.Runtime.CompilerServices;
using CommonServiceLocator;
using GalaSoft.MvvmLight.Ioc;

namespace HxLabwrEd2.ViewModel;

public class ViewModelLocator
{
	[Serializable]
	[CompilerGenerated]
	private sealed class _003C_003Ec
	{
		public static readonly _003C_003Ec _003C_003E9 = new _003C_003Ec();

		public static ServiceLocatorProvider _003C_003E9__0_0;

		internal IServiceLocator _003C_002Ector_003Eb__0_0()
		{
			return (IServiceLocator)(object)SimpleIoc.Default;
		}
	}

	public ApplicationViewModel ApplicationViewModel => ServiceLocator.Current.GetInstance<ApplicationViewModel>();

	public TitlePageViewModel TitlePageViewModel => ServiceLocator.Current.GetInstance<TitlePageViewModel>();

	public NewLabwareViewModel NewLabwareViewModel => ServiceLocator.Current.GetInstance<NewLabwareViewModel>();

	public NimbusFlexCarrierTypeViewModel NimbusFlexCarrierTypeViewModel => ServiceLocator.Current.GetInstance<NimbusFlexCarrierTypeViewModel>();

	public CreationNimbusFlexCarrierViewModel CreationNimbusFlexCarrierViewModel => ServiceLocator.Current.GetInstance<CreationNimbusFlexCarrierViewModel>();

	public NimbusFlexCarrierPropertiesViewModel NimbusFlexCarrierPropertiesViewModel => ServiceLocator.Current.GetInstance<NimbusFlexCarrierPropertiesViewModel>();

	public NimbusCarrierTypeViewModel NimbusCarrierTypeViewModel => ServiceLocator.Current.GetInstance<NimbusCarrierTypeViewModel>();

	public NimbusFlexCarrierPedestalSelectorViewModel NimbusFlexCarrierPedestalSelectorViewModel => ServiceLocator.Current.GetInstance<NimbusFlexCarrierPedestalSelectorViewModel>();

	public LoadedTemplateViewModel LoadedTemplateViewModel => ServiceLocator.Current.GetInstance<LoadedTemplateViewModel>();

	public Labware2DViewModel Labware2DViewModel => ServiceLocator.Current.GetInstance<Labware2DViewModel>();

	public LoadedGeneralPropertiesViewModel LoadedGeneralPropertiesViewModel => ServiceLocator.Current.GetInstance<LoadedGeneralPropertiesViewModel>();

	public LoadedBarCatPropViewModel LoadedBarCatPropViewModel => ServiceLocator.Current.GetInstance<LoadedBarCatPropViewModel>();

	public DialogPropertiesViewModel DialogPropertiesViewModel => ServiceLocator.Current.GetInstance<DialogPropertiesViewModel>();

	public DialogUnsavedChangesViewModel DialogUnsavedChangesViewModel => ServiceLocator.Current.GetInstance<DialogUnsavedChangesViewModel>();

	public DialogCategoriesViewModel DialogCategoriesViewModel => ServiceLocator.Current.GetInstance<DialogCategoriesViewModel>();

	public DialogTemplateSitesViewModel DialogTemplateSitesViewModel => ServiceLocator.Current.GetInstance<DialogTemplateSitesViewModel>();

	public CatManagerViewModel CatManagerViewModel => ServiceLocator.Current.GetInstance<CatManagerViewModel>();

	public CreationContainerViewModel CreationContainerViewModel => ServiceLocator.Current.GetInstance<CreationContainerViewModel>();

	public CreationMicrotiterPlateViewModel CreationMicrotiterPlateViewModel => ServiceLocator.Current.GetInstance<CreationMicrotiterPlateViewModel>();

	public LoadedContainerViewModel LoadedContainerViewModel => ServiceLocator.Current.GetInstance<LoadedContainerViewModel>();

	public DialogContainerSegmentsViewModel DialogContainerSegmentsViewModel => ServiceLocator.Current.GetInstance<DialogContainerSegmentsViewModel>();

	public DialogSimpleWarningViewModel DialogSimpleWarningViewModel => ServiceLocator.Current.GetInstance<DialogSimpleWarningViewModel>();

	public LoadedContainerGeneralPropertiesViewModel LoadedContainerGeneralPropertiesViewModel => ServiceLocator.Current.GetInstance<LoadedContainerGeneralPropertiesViewModel>();

	public LoadedContainerPropertiesViewModel LoadedContainerPropertiesViewModel => ServiceLocator.Current.GetInstance<LoadedContainerPropertiesViewModel>();

	public LoadedRectangularRackViewModel LoadedRectangularRackViewModel => ServiceLocator.Current.GetInstance<LoadedRectangularRackViewModel>();

	public DialogCircularRackSettingsViewModel DialogCircularRackSettingsViewModel => ServiceLocator.Current.GetInstance<DialogCircularRackSettingsViewModel>();

	public DialogCircularRackSegmentsViewModel DialogCircularRackSegmentsViewModel => ServiceLocator.Current.GetInstance<DialogCircularRackSegmentsViewModel>();

	public DialogRackContainersViewModel DialogRackContainersViewModel => ServiceLocator.Current.GetInstance<DialogRackContainersViewModel>();

	public DialogRectangularRackCoverViewModel DialogRectangularRackCoverViewModel => ServiceLocator.Current.GetInstance<DialogRectangularRackCoverViewModel>();

	public DialogRackGripSegmentsViewModel DialogRackGripSegmentsViewModel => ServiceLocator.Current.GetInstance<DialogRackGripSegmentsViewModel>();

	public DialogRackIrregularPatternViewModel DialogRackIrregularPatternViewModel => ServiceLocator.Current.GetInstance<DialogRackIrregularPatternViewModel>();

	public DialogRackRegularPatternViewModel DialogRackRegularPatternViewModel => ServiceLocator.Current.GetInstance<DialogRackRegularPatternViewModel>();

	public CreationIrregularRackViewModel CreationIrregularRackViewModel => ServiceLocator.Current.GetInstance<CreationIrregularRackViewModel>();

	public CreationRegularRackViewModel CreationRegularRackViewModel => ServiceLocator.Current.GetInstance<CreationRegularRackViewModel>();

	public CreationMicrotiterPlatePropertiesViewModel CreationMicrotiterPlatePropertiesViewModel => ServiceLocator.Current.GetInstance<CreationMicrotiterPlatePropertiesViewModel>();

	public CreationIrregularRackPropertiesViewModel CreationIrregularRackPropertiesViewModel => ServiceLocator.Current.GetInstance<CreationIrregularRackPropertiesViewModel>();

	public CreationRackContainerPropertiesViewModel CreationRackContainerPropertiesViewModel => ServiceLocator.Current.GetInstance<CreationRackContainerPropertiesViewModel>();

	public CreationRegularRackPropertiesViewModel CreationRegularRackPropertiesViewModel => ServiceLocator.Current.GetInstance<CreationRegularRackPropertiesViewModel>();

	public LoadedTemplatePropertiesViewModel LoadedTemplatePropertiesViewModel => ServiceLocator.Current.GetInstance<LoadedTemplatePropertiesViewModel>();

	public CreationTemplateCustomViewModel CreationTemplateCustomViewModel => ServiceLocator.Current.GetInstance<CreationTemplateCustomViewModel>();

	public CreationNimbusPedestalViewModel CreationNimbusPedestalViewModel => ServiceLocator.Current.GetInstance<CreationNimbusPedestalViewModel>();

	public CreationNimbusPedestalPropertiesViewModel CreationNimbusPedestalPropertiesViewModel => ServiceLocator.Current.GetInstance<CreationNimbusPedestalPropertiesViewModel>();

	public CreationCircularRackViewModel CreationCircularRackViewModel => ServiceLocator.Current.GetInstance<CreationCircularRackViewModel>();

	public CreationCircularRackPropertiesViewModel CreationCircularRackPropertiesViewModel => ServiceLocator.Current.GetInstance<CreationCircularRackPropertiesViewModel>();

	public LoadedCircularRackViewModel LoadedCircularRackViewModel => ServiceLocator.Current.GetInstance<LoadedCircularRackViewModel>();

	public StarCarrierTypeViewModel StarCarrierTypeViewModel => ServiceLocator.Current.GetInstance<StarCarrierTypeViewModel>();

	public StarFlexCarrierTypeViewModel StarFlexCarrierTypeViewModel => ServiceLocator.Current.GetInstance<StarFlexCarrierTypeViewModel>();

	public CreationStarFlexCarrierViewModel CreationStarFlexCarrierViewModel => ServiceLocator.Current.GetInstance<CreationStarFlexCarrierViewModel>();

	public StarFlexCarrierPedestalSelectorViewModel StarFlexCarrierPedestalSelectorViewModel => ServiceLocator.Current.GetInstance<StarFlexCarrierPedestalSelectorViewModel>();

	public StarFlexCarrierPropertiesViewModel StarFlexCarrierPropertiesViewModel => ServiceLocator.Current.GetInstance<StarFlexCarrierPropertiesViewModel>();

	public CategoryFilterManagerViewModel CategoryFilterManagerViewModel => ServiceLocator.Current.GetInstance<CategoryFilterManagerViewModel>();

	public DialogCategoryDeletionViewModel DialogCategoryDeletionViewModel => ServiceLocator.Current.GetInstance<DialogCategoryDeletionViewModel>();

	public DialogCategoryDeletionSaveViewModel DialogCategoryDeletionSaveViewModel => ServiceLocator.Current.GetInstance<DialogCategoryDeletionSaveViewModel>();

	public DialogFilterNamingViewModel DialogFilterNamingViewModel => ServiceLocator.Current.GetInstance<DialogFilterNamingViewModel>();

	public ViewModelLocator()
	{
		//IL_001a: Unknown result type (might be due to invalid IL or missing references)
		//IL_001f: Unknown result type (might be due to invalid IL or missing references)
		//IL_0025: Expected O, but got Unknown
		object obj = _003C_003Ec._003C_003E9__0_0;
		if (obj == null)
		{
			ServiceLocatorProvider val = () => (IServiceLocator)(object)SimpleIoc.Default;
			_003C_003Ec._003C_003E9__0_0 = val;
			obj = (object)val;
		}
		ServiceLocator.SetLocatorProvider((ServiceLocatorProvider)obj);
		SimpleIoc.Default.Register<ApplicationViewModel>();
		SimpleIoc.Default.Register<TitlePageViewModel>();
		SimpleIoc.Default.Register<NewLabwareViewModel>();
		SimpleIoc.Default.Register<NimbusFlexCarrierTypeViewModel>();
		SimpleIoc.Default.Register<CreationNimbusFlexCarrierViewModel>();
		SimpleIoc.Default.Register<NimbusCarrierTypeViewModel>();
		SimpleIoc.Default.Register<NimbusFlexCarrierPropertiesViewModel>();
		SimpleIoc.Default.Register<NimbusFlexCarrierPedestalSelectorViewModel>();
		SimpleIoc.Default.Register<LoadedTemplateViewModel>();
		SimpleIoc.Default.Register<Labware2DViewModel>();
		SimpleIoc.Default.Register<LoadedGeneralPropertiesViewModel>();
		SimpleIoc.Default.Register<LoadedBarCatPropViewModel>();
		SimpleIoc.Default.Register<DialogPropertiesViewModel>();
		SimpleIoc.Default.Register<DialogUnsavedChangesViewModel>();
		SimpleIoc.Default.Register<DialogCategoriesViewModel>();
		SimpleIoc.Default.Register<DialogTemplateSitesViewModel>();
		SimpleIoc.Default.Register<CatManagerViewModel>();
		SimpleIoc.Default.Register<CreationContainerViewModel>();
		SimpleIoc.Default.Register<CreationMicrotiterPlateViewModel>();
		SimpleIoc.Default.Register<LoadedContainerViewModel>();
		SimpleIoc.Default.Register<DialogContainerSegmentsViewModel>();
		SimpleIoc.Default.Register<DialogSimpleWarningViewModel>();
		SimpleIoc.Default.Register<LoadedContainerGeneralPropertiesViewModel>();
		SimpleIoc.Default.Register<LoadedContainerPropertiesViewModel>();
		SimpleIoc.Default.Register<LoadedRectangularRackViewModel>();
		SimpleIoc.Default.Register<DialogCircularRackSettingsViewModel>();
		SimpleIoc.Default.Register<DialogCircularRackSegmentsViewModel>();
		SimpleIoc.Default.Register<DialogRackContainersViewModel>();
		SimpleIoc.Default.Register<DialogRectangularRackCoverViewModel>();
		SimpleIoc.Default.Register<DialogRackGripSegmentsViewModel>();
		SimpleIoc.Default.Register<DialogRackIrregularPatternViewModel>();
		SimpleIoc.Default.Register<DialogRackRegularPatternViewModel>();
		SimpleIoc.Default.Register<CreationIrregularRackViewModel>();
		SimpleIoc.Default.Register<CreationRegularRackViewModel>();
		SimpleIoc.Default.Register<CreationMicrotiterPlatePropertiesViewModel>();
		SimpleIoc.Default.Register<CreationIrregularRackPropertiesViewModel>();
		SimpleIoc.Default.Register<CreationRackContainerPropertiesViewModel>();
		SimpleIoc.Default.Register<CreationRegularRackPropertiesViewModel>();
		SimpleIoc.Default.Register<LoadedTemplatePropertiesViewModel>();
		SimpleIoc.Default.Register<CreationTemplateCustomViewModel>();
		SimpleIoc.Default.Register<CreationNimbusPedestalViewModel>();
		SimpleIoc.Default.Register<CreationNimbusPedestalPropertiesViewModel>();
		SimpleIoc.Default.Register<CreationCircularRackViewModel>();
		SimpleIoc.Default.Register<CreationCircularRackPropertiesViewModel>();
		SimpleIoc.Default.Register<LoadedCircularRackViewModel>();
		SimpleIoc.Default.Register<StarCarrierTypeViewModel>();
		SimpleIoc.Default.Register<StarFlexCarrierTypeViewModel>();
		SimpleIoc.Default.Register<CreationStarFlexCarrierViewModel>();
		SimpleIoc.Default.Register<StarFlexCarrierPedestalSelectorViewModel>();
		SimpleIoc.Default.Register<StarFlexCarrierPropertiesViewModel>();
		SimpleIoc.Default.Register<CategoryFilterManagerViewModel>();
		SimpleIoc.Default.Register<DialogCategoryDeletionViewModel>();
		SimpleIoc.Default.Register<DialogCategoryDeletionSaveViewModel>();
		SimpleIoc.Default.Register<DialogFilterNamingViewModel>();
	}

	public static void Cleanup()
	{
		if (SimpleIoc.Default.IsRegistered<ApplicationViewModel>())
		{
			SimpleIoc.Default.Unregister<ApplicationViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<TitlePageViewModel>())
		{
			SimpleIoc.Default.Unregister<TitlePageViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<NewLabwareViewModel>())
		{
			SimpleIoc.Default.Unregister<NewLabwareViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<NimbusFlexCarrierTypeViewModel>())
		{
			SimpleIoc.Default.Unregister<NimbusFlexCarrierTypeViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationNimbusFlexCarrierViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationNimbusFlexCarrierViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<NimbusCarrierTypeViewModel>())
		{
			SimpleIoc.Default.Unregister<NimbusCarrierTypeViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<NimbusFlexCarrierPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<NimbusFlexCarrierPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<NimbusFlexCarrierPedestalSelectorViewModel>())
		{
			SimpleIoc.Default.Unregister<NimbusFlexCarrierPedestalSelectorViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedTemplateViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedTemplateViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<Labware2DViewModel>())
		{
			SimpleIoc.Default.Unregister<Labware2DViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedGeneralPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedGeneralPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedBarCatPropViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedBarCatPropViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogUnsavedChangesViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogUnsavedChangesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogCategoriesViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogCategoriesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogTemplateSitesViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogTemplateSitesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CatManagerViewModel>())
		{
			SimpleIoc.Default.Unregister<CatManagerViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationContainerViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationContainerViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationMicrotiterPlateViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationMicrotiterPlateViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedContainerViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedContainerViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogSimpleWarningViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogSimpleWarningViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedContainerGeneralPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedContainerGeneralPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedContainerPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedContainerPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedRectangularRackViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedRectangularRackViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogCircularRackSegmentsViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogCircularRackSegmentsViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogCircularRackSettingsViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogCircularRackSettingsViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogRackContainersViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogRackContainersViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogRectangularRackCoverViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogRectangularRackCoverViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogRackGripSegmentsViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogRackGripSegmentsViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogRackIrregularPatternViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogRackIrregularPatternViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogRackRegularPatternViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogRackRegularPatternViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationIrregularRackViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationIrregularRackViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationRegularRackViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationRegularRackViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationMicrotiterPlatePropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationMicrotiterPlatePropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationIrregularRackPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationIrregularRackPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationRackContainerPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationRackContainerPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationRegularRackPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationRegularRackPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedTemplatePropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedTemplatePropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationTemplateCustomViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationTemplateCustomViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationNimbusPedestalViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationNimbusPedestalViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationNimbusPedestalPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationNimbusPedestalPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationCircularRackViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationCircularRackViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationCircularRackPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationCircularRackPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<LoadedCircularRackViewModel>())
		{
			SimpleIoc.Default.Unregister<LoadedCircularRackViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<StarCarrierTypeViewModel>())
		{
			SimpleIoc.Default.Unregister<StarCarrierTypeViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<StarFlexCarrierTypeViewModel>())
		{
			SimpleIoc.Default.Unregister<StarFlexCarrierTypeViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CreationStarFlexCarrierViewModel>())
		{
			SimpleIoc.Default.Unregister<CreationStarFlexCarrierViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<StarFlexCarrierPedestalSelectorViewModel>())
		{
			SimpleIoc.Default.Unregister<StarFlexCarrierPedestalSelectorViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<StarFlexCarrierPropertiesViewModel>())
		{
			SimpleIoc.Default.Unregister<StarFlexCarrierPropertiesViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<CategoryFilterManagerViewModel>())
		{
			SimpleIoc.Default.Unregister<CategoryFilterManagerViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogCategoryDeletionViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogCategoryDeletionViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogCategoryDeletionSaveViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogCategoryDeletionSaveViewModel>();
		}
		if (SimpleIoc.Default.IsRegistered<DialogFilterNamingViewModel>())
		{
			SimpleIoc.Default.Unregister<DialogFilterNamingViewModel>();
		}
	}
}
