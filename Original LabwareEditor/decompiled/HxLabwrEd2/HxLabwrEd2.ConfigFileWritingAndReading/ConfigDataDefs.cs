namespace HxLabwrEd2.ConfigFileWritingAndReading;

public static class ConfigDataDefs
{
	public const string Version = "dataVersion";

	public const string PhoenixVersion = "PhoenixVersion";

	public const string Default = "default";

	public const string DimX = "Dim.Dx";

	public const string DimY = "Dim.Dy";

	public const string DimZ = "Dim.Dz";

	public const string Clearance = "Clearance";

	public const string LiquidSeek = "LiquidSeek";

	public const string TouchOff = "TouchOff";

	public const string Bitmap = "Bitmap";

	public const string BitmapRel = "BitmapRel";

	public const string Image = "Image3D";

	public const string ImageRel = "ImageRel";

	public const string Model = "3DModel";

	public const string ModelRel = "3DModelRel";

	public const string ModelOffsetX = "3DxOffset";

	public const string ModelOffsetY = "3DyOffset";

	public const string ModelOffsetZ = "3DzOffset";

	public const string CoverBitmap = "Coverbitmap";

	public const string CoverClearance = "CoverClearance";

	public const string CoverThickness = "CoverThickness";

	public const string CoverStackHeight = "CoverStackHeight";

	public const string CoverBaseToRackBase = "CvrBaseToRackBase";

	public const string Shape = "Shape";

	public const string BackgroundColor = "BackgrndClr";

	public const string Name = "Name";

	public const string Visiable = "Visible";

	public const string CategoryCount = "CategoryCnt";

	public const string Category = "Category.{0}.Id";

	public const string ViewName = "ViewName";

	public const string Description = "Description";

	public const string PropertyCount = "PropertyCnt";

	public const string PropertyName = "Property.{0}";

	public const string PropertyValue = "PropertyValue.{0}";

	public const string BarcodePosX = "Barcode.X";

	public const string BarcodePosY = "Barcode.Y";

	public const string BarcodePosZ = "Barcode.Z";

	public const string BarcodeDx = "Barcode.Dx";

	public const string BarcodeDy = "Barcode.Dy";

	public const string BarcodeValue = "Barcode.Value";

	public const string BarcodeUnique = "Barcode.Unique";

	public const string BarcodeOrientation = "Barcode.Orientation";

	public const string ReadOnly = "ReadOnly";

	public const string UseGlobalTpl = "UseGlobalTpl";

	public const string Deck = "DECK";

	public const string DeckOriginX = "Origin.X";

	public const string DeckOriginY = "Origin.Y";

	public const string DeckOriginZ = "Origin.Z";

	public const string DeckAxisX = "Axis.X";

	public const string DeckAxisY = "Axis.Y";

	public const string DeckAxisZ = "Axis.Z";

	public const string TargetCount = "Target.Cnt";

	public const string TargetId = "Target.{0}.Id";

	public const string TargetX = "Target.{0}.X";

	public const string TargetY = "Target.{0}.Y";

	public const string TargetZ = "Target.{0}.Z";

	public const string SiteCount = "Site.Cnt";

	public const string SiteId = "Site.{0}.Id";

	public const string SiteX = "Site.{0}.X";

	public const string SiteY = "Site.{0}.Y";

	public const string SiteZ = "Site.{0}.Z";

	public const string SiteDx = "Site.{0}.Dx";

	public const string SiteDy = "Site.{0}.Dy";

	public const string SiteLabel = "Site.{0}.Label";

	public const string SiteSnapBase = "Site.{0}.SnapBase";

	public const string SiteVisible = "Site.{0}.Visible";

	public const string SiteLabwareFile = "Site.{0}.LabwareFile";

	public const string SiteLabwareFileRel = "Site.{0}.LabwareFileRel";

	public const string SiteBitmap = "Site.{0}.Bitmap";

	public const string SiteStack = "Site.{0}.Stack";

	public const string SiteStackSize = "Site.{0}.StackSize";

	public const string SiteIsCovered = "Site.{0}.IsCovered";

	public const string SitePosition = "Site.{0}.Posn";

	public const string ExSiteCount = "ExSite.Cnt";

	public const string ExSiteId = "ExSite.{0}.Id";

	public const string ExSiteX = "ExSite.{0}.X";

	public const string ExSiteY = "ExSite.{0}.Y";

	public const string ExSiteZ = "ExSite.{0}.Z";

	public const string ExSiteDx = "ExSite.{0}.Dx";

	public const string ExSiteDy = "ExSite.{0}.Dy";

	public const string ExSiteLabel = "ExSite.{0}.Label";

	public const string ExSiteStapBase = "ExSite.{0}.SnapBase";

	public const string ExSiteVisible = "ExSite.{0}.Visible";

	public const string ExSiteBitmap = "ExSite.{0}.Bitmap";

	public const short CurrentDeckLayoutWriteVersion = 5;

	public const string DeckLayout = "DECKLAY";

	public const string ActiveLayer = "ActiveLayer";

	public const string LayerCount = "Layer.Cnt";

	public const string LayerName = "Layer.{0}.Name";

	public const string LayerViz = "Layer.{0}.Viz";

	public const string LayerSequenceCount = "Layer.{0}.SeqCnt";

	public const string LayerSequenceName = "Layer.{0}.{1}.SeqName";

	public const string LayerLabwareCount = "Layer.{0}.LabwareCnt";

	public const string LayerLabwareName = "Layer.{0}.{1}.LabwareName";

	public const string Instrument = "Instrument";

	public const string DeckConfig = "Deck";

	public const string DefaultWash = "DefaultWash";

	public const string LabwareCount = "Labware.Cnt";

	public const string ViewAngle = "ViewAngle";

	public const string LabwareAngle = "Labware.{0}.Angle";

	public const string LabwareClsid = "Labware.{0}.Clsid";

	public const string LabwareFile = "Labware.{0}.File";

	public const string LabwareInst = "Labware.{0}.Inst";

	public const string LabwareId = "Labware.{0}.Id";

	public const string LabwareTemplate = "Labware.{0}.Template";

	public const string LabwareSiteId = "Labware.{0}.SiteId";

	public const string LabwareZTrans = "Labware.{0}.ZTrans";

	public const string LabwareZTransValue = "Labware.{0}.ZTransValue";

	public const string LabwareDefinitionSequenceValid = "Labware.{0}.DefSeqValid";

	public const string LabwareTFormX = "Labware.{0}.TForm.{1}.X";

	public const string LabwareTFormY = "Labware.{0}.TForm.{1}.Y";

	public const string LabwareTFormZ = "Labware.{0}.TForm.{1}.Z";

	public const string LabwareProbeAdjX = "Labware.{0}.PrbAdj.X";

	public const string LabwareProbeAdjY = "Labware.{0}.PrbAdj.Y";

	public const string LabwareProbeAdjZ = "Labware.{0}.PrbAdj.Z";

	public const string LabwareOrientatation = "Labware.{0}.Orient";

	public const string LabwareViz = "Labware.{0}.Viz";

	public const string LabwareLabwareProperties = "Labware.{0}.Properties";

	public const string LabwareNumOfLabwareProperties = "Labware.{0}.NumOfProps";

	public const string LabwareLabwareProperty = "Labware.{0}.Properties.{1}.Property";

	public const string LabwareLabwarePropertyValue = "Labware.{0}.Properties.{1}.Value";

	public const string LabwareDefinitionBarcodeUnique = "Labware.{0}.BarcodeUnique";

	public const string LabwareBarcodeCount = "Labware.{0}.BarcodeCnt";

	public const string LabwareBarcodePosition = "Labware.{0}.Barcode.{1}.Posn";

	public const string LabwareBarcodeValue = "Labware.{0}.Barcode.{1}.Value";

	public const string LabwareBarcodeUnique = "Labware.{0}.Barcode.{1}.Unique";

	public const string LabwareSpecData = "Labware.{0}.LwProperties.";

	public const string LabwareSpecDataNumOfProperties = "Labware.{0}.LwProperties.NumOfProps";

	public const string LabwareSpecDataProperty = "Labware.{0}.LwProperties.{1}.Property";

	public const string LabwareSpecDataValue = "Labware.{0}.LwProperties.{1}.Value";

	public const string LabwareDeckPositionX = "Labware.{0}.DkPos.X";

	public const string LabwareDeckPositionY = "Labwrae.{0}.DkPos.Y";

	public const string LabwareDeckPositionZ = "Labware.{0}.DkPos.Z";

	public const string LabwareDeckPositionContainer = "Labware.{0}.DkPos.Container";

	public const string LabwareStackId = "Labware.{0}.StackID";

	public const string LabwareIsCovered = "Labware.{0}.IsCovered";

	public const string SequenceCount = "Seq.Cnt";

	public const string SequenceName = "Seq.{0}.Name";

	public const string SequenceItemCount = "Seq.{0}.Cnt";

	public const string SequenceReadOnly = "Seq.{0}.ReadOnly";

	public const string SequenceObjectId = "Seq.{0}.Item.{1}.ObjId";

	public const string SequencePositionId = "Seq.{0}.Item.{1}.PosId";

	public const string DeckView = "DeckView";

	public const string ShowVisibleOnly = "showVisibleOnly";

	public const string ShowProcessing = "showProcessing";

	public const string SelectedColor = "SelectedColor";

	public const string ProcessingColor = "ProcessingColor";

	public const string ErrorColor = "ErrorColor";

	public const string ProcessedColor = "ProcessedColor";

	public const string WarningColor = "WarningColor";

	public const short CurrentRackWriteVersion = 3;

	public const short CurrentCircularRackWriteVersion = 4;

	public const short CurrentCoverWriteVersion = 1;

	public const string Cover = "COVER";

	public const string RectangularRack = "RECTRACK";

	public const string CircularRack = "CIRCRACK";

	public const string PointRack = "POINTRACK";

	public const string Options = "Options";

	public const string Index = "IX.Index";

	public const string IXFirst = "IX.First";

	public const string IXStart = "IX.Start";

	public const string IXInc = "IX.Inc";

	public const string Rows = "Rows";

	public const string Columns = "Columns";

	public const string Dx = "Dx";

	public const string Dy = "Dy";

	public const string Stagger = "Stagger";

	public const string StackHeight = "StackHt";

	public const string DataType = "DataType";

	public const string UseBoundary = "UseBndry";

	public const string BoundaryX = "BndryX";

	public const string BoundaryY = "BndryY";

	public const string Diameter = "Diameter";

	public const string CenterX = "CenterX";

	public const string CenterY = "CenterY";

	public const string FirstX = "FirstX";

	public const string FirstY = "FirstY";

	public const string CoverFile = "CoverFile";

	public const string SegmentFirstX = "{0}.FirstX";

	public const string SegmentFirstY = "{0}.FirstY";

	public const string SegmentLastX = "{0}.LastX";

	public const string SegmentLastY = "{0}.LastY";

	public const string SegmentMidX = "{0}.MidX";

	public const string SegmentMidY = "{0}.MidY";

	public const string SegmentHoleCount = "{0}.HoleCnt";

	public const string SegmentHole = "{0}.";

	public const string HoleX = "Hole.X";

	public const string HoleY = "Hole.Y";

	public const string HoleZ = "Hole.Z";

	public const string HoleShape = "Hole.Shape";

	public const string HoleCount = "HoleCnt";

	public const string PosX = "{0}.X";

	public const string PosY = "{0}.Y";

	public const string PosId = "{0}.ID";

	public const string ConnectedContainer = "ConnectedCtr";

	public const string SingleCntr = "SingleCntr";

	public const string CntrCount = "CntrCnt";

	public const string CntrPosition = "Cntr.{0}.posn";

	public const string CntrFile = "Cntr.{0}.file";

	public const string CntrFileRel = "Cntr.{0}.fileRel";

	public const string CntrBase = "Cntr.{0}.base";

	public const string CntrOffsetX = "Cntr.{0}.offsetx";

	public const string CntrOffsetY = "Cntr.{0}.offsety";

	public const string GrpStartPos = "Cntr.{0}.startpos";

	public const string GrpSize = "Cntr.{0}.size";

	public const string GrpCount = "GrpCnt";

	public const short MinimumDistanceBetweenHoles = 5;

	public const short CurrentContainerWriteVersion = 3;

	public const short ContainerVolumePrecision = 4;

	public const string Container = "CONTAINER";

	public const string ContainerDepth = "Depth";

	public const string ContainerMaxDepth = "MaxDepth";

	public const string ContainerBase = "Base";

	public const string ContainerLSValid = "LS";

	public const string ContainerLSHT = "LSHt";

	public const string ContainerTouchoffValid = "TchOff";

	public const string ContainerTouchoffHeight = "TchHt";

	public const string ContainerTouchoffFront = "TchFront";

	public const string ContainerTouchoffBack = "TchBack";

	public const string ContainerTouchoffLeft = "TchLeft";

	public const string ContainerTouchoffRight = "TchRight";

	public const string ContainerTouchoffBase = "TchBase";

	public const string ContainerBaseMM = "BaseMM";

	public const string ContainerSegments = "Segments";

	public const string ContainerCLLD = "cLLD";

	public const string ContainerSegmentMin = "{0}.Min";

	public const string ContainerSegmentMax = "{0}.Max";

	public const string ContainerSegmentDiamX = "{0}.DX";

	public const string ContainerSegmentDiamY = "{0}.DY";

	public const string ContainerSegmentDiamZ = "{0}.DZ";

	public const string ContainerSegmentShape = "{0}.Shape";

	public const string ContainerSegmentVolumeEquation = "{0}.EqnOfVol";

	public const string CoverRackBaseToCoverBase = "RackBaseToCoverBase";

	public const string CoverCoveredStackHeight = "CoveredStackHt";

	public const string CoverExtentX = "XExtent";

	public const string CoverExtentY = "YExtent";

	public const short CurrentWashStationWriteVersion = 2;

	public const string WashStation = "WASHSTATION";

	public const string LabwareProperties = "LABWAREPROPERTIES";

	public const string LabwarePropertiesNumberOfObjects = "NumOfObjs";

	public const string LabwarePropertiesProgId = "{0}.ProgID";

	public const string LabwarePropertiesNumOfProperties = "{0}.NumOfProps";

	public const string LabwarePropertiesProperty = "{0}.{1}.Property";

	public const string LabwarePropertiesInitialValue = "{0}.{1}.InitValue";

	public const string LSDNumberOfProperties = "Data.NumofProps";

	public const string LSDProperty = "Data.Property";

	public const string LSDValue = "Data.Value";

	public const short CurrentTemplateWriteVersion = 1;

	public const string Template = "TEMPLATE";

	public const string SealHead = "SEALHEAD";

	public const string SealHeadMinZ = "MinZ";

	public const string SealHeadSeekZ = "SeekZ";

	public const string SealHeadExitZ = "ExitZ";

	public const string SealHeadExitY = "ExitY";

	public const string WhiteTransparent = "55FFFFFF";

	public const short HxConfigFileStatusNone = -1;

	public const short HxConfigFileStatusNotValid = 0;

	public const short HxConfigFileStatusValid = 1;

	public const short HxConfigFileLengthNameToken = 255;

	public const short HxConfigFileLengthStringToken = 4095;

	public const string RackSegmentXCount = "SegmentCount_x";

	public const string RackSegmentXUpperWidth = "Seg_x.{0}.UpperWidth";

	public const string RackSegmentXLowerWidth = "Seg_x.{0}.LowerWidth";

	public const string RackSegmentXHeight = "Seg_x.{0}.SegmentHeight";

	public const string RackSegmentYCount = "SegmentCount_y";

	public const string RackSegmentYUpperWidth = "Seg_y.{0}.UpperWidth";

	public const string RackSegmentYLowerWidth = "Seg_y.{0}.LowerWidth";

	public const string RackSegmentYHeight = "Seg_y.{0}.SegmentHeight";

	public const string LabwareFiltering = "LABWAREFILTERING";

	public const string LabwareFilteringEnabled = "LabwareFilteringEnabled";

	public const string CurrentFilterName = "CurrentFilterName";

	public const string DefaultFilterName = "Default";

	public const string CategoryLegacyIcon = "default.bmp";
}
