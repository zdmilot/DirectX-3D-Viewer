--
-- HAMILTON Vector Database Creation Script
--
-- DBVersion: 2

%%%SWITCH_BEGIN_DROP_EXISTING_DATABASE%%%
-- Drop existing HamiltonVectorDB
IF EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = N'%%%VARIABLE_DBNAME%%%')
	DROP DATABASE [%%%VARIABLE_DBNAME%%%]
GO
%%%SWITCH_END_DROP_EXISTING_DATABASE%%%


%%%SWITCH_BEGIN_DROP_EXISTING_LOGIN%%%
-- Drop existing Hamilton login
IF EXISTS (SELECT loginname FROM master.dbo.syslogins WHERE loginname=N'%%%VARIABLE_USERNAME%%%')
	EXEC sp_droplogin '%%%VARIABLE_USERNAME%%%'
GO
%%%SWITCH_END_DROP_EXISTING_LOGIN%%%

%%%SWITCH_BEGIN_CREATE_DATABASE%%%
-- Create new database HamiltonVectorDB
CREATE DATABASE [%%%VARIABLE_DBNAME%%%]
%%%SWITCH_END_CREATE_DATABASE%%%
%%%SWITCH_BEGIN_CREATE_DATABASE_FILENAMES%%%
ON 
( NAME = '%%%VARIABLE_DBNAME%%%', FILENAME = '%%%VARIABLE_PRIMARYFILENAME%%%' )
LOG ON
( NAME = '%%%VARIABLE_DBNAME%%%_log', FILENAME = '%%%VARIABLE_LOGFILENAME%%%' )
%%%SWITCH_END_CREATE_DATABASE_FILENAMES%%%
%%%SWITCH_BEGIN_CREATE_DATABASE_FILENAMES_WITH_FILEGROWTH%%%
ON 
( NAME = '%%%VARIABLE_DBNAME%%%', FILENAME = '%%%VARIABLE_PRIMARYFILENAME%%%', FILEGROWTH = 5MB )
LOG ON
( NAME = '%%%VARIABLE_DBNAME%%%_log', FILENAME = '%%%VARIABLE_LOGFILENAME%%%', FILEGROWTH = 5MB )
%%%SWITCH_END_CREATE_DATABASE_FILENAMES_WITH_FILEGROWTH%%%
%%%SWITCH_BEGIN_CREATE_DATABASE%%%
COLLATE SQL_Latin1_General_CP1_CS_AS
GO

use [%%%VARIABLE_DBNAME%%%]
GO

-- Create tables, views and stored procedures
CREATE TABLE [dbo].[HxError] (
	[ErrorID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ErrorCode] [nvarchar] (25) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ErrorMessage] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[InstrumentConfigurationID] [bigint] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxExperiment] (
	[ExperimentID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[Name] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[Description] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ExperimentTime] [datetime] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxInstrument] (
	[InstrumentID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[InstrumentName] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[SerialNumber] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[InstrumentClass] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxJob] (
	[JobID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[JobName] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[JobPriority] [tinyint] NOT NULL ,
	[JobState] [tinyint] NOT NULL ,
	[UserJobState] [tinyint] NULL ,
	[RunID] [bigint] NULL ,
	[SourceElementID] [bigint] NULL ,
	[SourceBarcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[SourceLabwareId] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[SourcePositionId] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[SourceRequired] [bit] NOT NULL ,
	[TargetElementID] [bigint] NULL ,
	[TargetBarcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[TargetLabwareId] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[TargetPositionId] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[TransportVolume] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareMainType] (
	[LabwareMainTypeID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[Name] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLiquidClass] (
	[LiquidClassID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[Name] [nvarchar] (100) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[Version] [varchar] (10) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxRun] (
	[RunID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[MethodName] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[RunGUID] [char] (32) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[StartTime] [datetime] NULL ,
	[EndTime] [datetime] NULL ,
	[RunState] [tinyint] NOT NULL ,
	[UserRunState] [tinyint] NULL ,
	[ComputerName] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[PhoenixVersion] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[DBVersion] [tinyint] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxAction] (
	[ActionID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ActionType] [tinyint] NOT NULL ,
	[ActionTime] [datetime] NOT NULL ,
	[ActionState] [tinyint] NOT NULL ,
	[ActionGroup] [bigint] NOT NULL ,
	[RunID] [bigint] NOT NULL ,
	[ErrorID] [bigint] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxInstrumentAdditionalData] (
	[InstrumentAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[InstrumentID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxInstrumentConfiguration] (
	[InstrumentConfigurationID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[InstrumentID] [bigint] NOT NULL ,
	[SimulationMode] [bit] NOT NULL ,
	[SoftwareVersion] [varchar] (20) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[FirmwareVersion] [varchar] (1000) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxJobAdditionalData] (
	[JobAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[JobID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareType] (
	[LabwareTypeID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[LabwareMainTypeID] [bigint] NULL ,
	[Name] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxRunAction] (
	[RunActionID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[Action] [tinyint] NOT NULL ,
	[Username] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ActionTime] [datetime] NOT NULL ,
	[RunID] [bigint] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxRunAdditionalData] (
	[RunAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[RunID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionAddSourceBarcode] (
	[ActionID] [bigint] NOT NULL ,
	[SourceBarcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionAdditionalData] (
	[ActionAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ActionID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionIncubate] (
	[ActionID] [bigint] NOT NULL ,
	[Duration] [float] NULL ,
	[Temperature] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionMove] (
	[ActionID] [bigint] NOT NULL ,
	[SourceParentElementID] [bigint] NULL ,
	[TargetParentElementID] [bigint] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionMoveVolume] (
	[ActionID] [bigint] NOT NULL ,
	[SourceLabwareVolume] [float] NOT NULL ,
	[TargetLabwareVolume] [float] NOT NULL ,
	[Volume] [float] NOT NULL ,
	[StepType] [tinyint] NOT NULL ,
	[ChannelNumber] [smallint] NOT NULL ,
	[LiquidClassID] [bigint] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionSetBarcode] (
	[ActionID] [bigint] NOT NULL ,
	[Barcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionSetLabwareState] (
	[ActionID] [bigint] NOT NULL ,
	[LabwareState] [tinyint] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxActionSetVolume] (
	[ActionID] [bigint] NOT NULL ,
	[Volume] [float] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxDeck] (
	[DeckID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[RunID] [bigint] NOT NULL ,
	[InstrumentConfigurationID] [bigint] NOT NULL ,
	[ParentDeckID] [bigint] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxInstrumentConfigurationAdditionalData] (
	[InstrumentConfigurationAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[InstrumentConfigurationID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxRunActionAdditionalData] (
	[RunActionAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[RunActionID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxTADMCurve] (
	[ActionID] [bigint] NOT NULL ,
	[TADMCurveID] [int] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabware] (
	[ElementID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ParentElementID] [bigint] NULL ,
	[DeckID] [bigint] NULL ,
	[LabwareName] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[LabwareLevel] [tinyint] NOT NULL ,
	[LabwareTypeID] [bigint] NULL ,
	[Barcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[Volume] [float] NULL ,
	[LabwareState] [tinyint] NOT NULL ,
	[UserLabwareState] [tinyint] NULL ,
	[DeckCoordinateX] [float] NULL ,
	[DeckCoordinateY] [float] NULL ,
	[DeckCoordinateZ] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareAction] (
	[ActionID] [bigint] NOT NULL ,
	[ElementID] [bigint] NOT NULL ,
	[DeckID] [bigint] NOT NULL ,
	[UsageType] [tinyint] NOT NULL ,
	[Referenced] [bit] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareAdditionalData] (
	[LabwareAdditionalDataID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ElementID] [bigint] NOT NULL ,
	[Key] [nvarchar] (50) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[ValueType] [tinyint] NOT NULL ,
	[StringValue] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NULL ,
	[IntegerValue] [int] NULL ,
	[FloatValue] [float] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareExperiment] (
	[ElementID] [bigint] NOT NULL ,
	[ExperimentID] [bigint] NOT NULL ,
	[ExperimentSource] [bit] NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxLabwareRunData] (
	[ElementID] [bigint] NOT NULL ,
	[RunID] [bigint] NOT NULL ,
	[LabwareState] [tinyint] NOT NULL ,
	[Interrupted] [bit] NOT NULL ,
	[Aborted] [bit] NOT NULL ,
	[ProcessedSteps] [bigint] NOT NULL ,
	[ExpectedProcessedSteps] [bigint] NOT NULL ,
	[LastActionState] [tinyint] NOT NULL ,
	[Barcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[InitialAccessName] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[InitialLabwareName] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL ,
	[InitialDeckID] [bigint] NOT NULL ,
	[InitialParentElementID] [bigint] NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxSourceBarcodeList] (
	[SourceBarcodeListID] [bigint] IDENTITY (1, 1) NOT NULL ,
	[ActionID] [bigint] NOT NULL ,
	[ElementID] [bigint] NOT NULL ,
	[Barcode] [nvarchar] (255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL 
) ON [PRIMARY]
GO

CREATE TABLE [dbo].[HxUniqueBarcodeList](
	[Barcode] [nvarchar](255) COLLATE SQL_Latin1_General_CP1_CS_AS NOT NULL,
	[UniqueBarcode] [bit] NOT NULL,
	[LastUsedTime] [datetime] NOT NULL,
	[RunID] [bigint] NOT NULL
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[HxError] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxError] PRIMARY KEY  CLUSTERED 
	(
		[ErrorID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxExperiment] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxExperiment] PRIMARY KEY  CLUSTERED 
	(
		[ExperimentID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxInstrument] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxInstrument] PRIMARY KEY  CLUSTERED 
	(
		[InstrumentID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxJob] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxJob] PRIMARY KEY  CLUSTERED 
	(
		[JobID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareMainType] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareMainType] PRIMARY KEY  CLUSTERED 
	(
		[LabwareMainTypeID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLiquidClass] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLiquidClass] PRIMARY KEY  CLUSTERED 
	(
		[LiquidClassID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxRun] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxRun] PRIMARY KEY  CLUSTERED 
	(
		[RunID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxAction] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxAction] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxInstrumentAdditionalData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxInstrumentAdditionalData] PRIMARY KEY  CLUSTERED 
	(
		[InstrumentAdditionalDataID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxInstrumentConfiguration] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxInstrumentConfiguration] PRIMARY KEY  CLUSTERED 
	(
		[InstrumentConfigurationID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxJobAdditionalData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxJobAdditionalData] PRIMARY KEY  CLUSTERED 
	(
		[JobAdditionalDataID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareType] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareType] PRIMARY KEY  CLUSTERED 
	(
		[LabwareTypeID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxRunAction] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxRunAction] PRIMARY KEY  CLUSTERED 
	(
		[RunActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionAddSourceBarcode] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionAddLabwareSourceBarcode] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionAdditionalData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionAdditionalData] PRIMARY KEY  CLUSTERED 
	(
		[ActionAdditionalDataID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionIncubate] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionIncubate] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionMove] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionMove] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionMoveVolume] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionMoveVolume] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionSetBarcode] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionSetBarcode] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionSetLabwareState] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionSetLabwareState] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxActionSetVolume] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxActionSetVolume] PRIMARY KEY  CLUSTERED 
	(
		[ActionID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxDeck] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxDeck] PRIMARY KEY  CLUSTERED 
	(
		[DeckID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxInstrumentConfigurationAdditionalData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxInstrumentConfigurationAdditionalData] PRIMARY KEY  CLUSTERED 
	(
		[InstrumentConfigurationAdditionalDataID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxTADMCurve] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxTADMCurve] PRIMARY KEY  CLUSTERED 
	(
		[ActionID],
		[TADMCurveID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabware] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabware] PRIMARY KEY  CLUSTERED 
	(
		[ElementID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareAction] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareAction] PRIMARY KEY  CLUSTERED 
	(
		[ActionID],
		[ElementID],
		[DeckID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareAdditionalData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareAdditionalData] PRIMARY KEY  CLUSTERED 
	(
		[LabwareAdditionalDataID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareExperiment] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareExperiment] PRIMARY KEY  CLUSTERED 
	(
		[ElementID],
		[ExperimentID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxLabwareRunData] WITH NOCHECK ADD 
	CONSTRAINT [PK_HxLabwareRunData] PRIMARY KEY  CLUSTERED 
	(
		[ElementID],
		[RunID]
	)  ON [PRIMARY] 
GO

ALTER TABLE [dbo].[HxSourceBarcodeList] WITH NOCHECK ADD
	CONSTRAINT [PK_HxSourceBarcodeList] PRIMARY KEY CLUSTERED
	(
		[SourceBarcodeListID] ASC
	)	ON [PRIMARY]	
GO

ALTER TABLE [dbo].[HxUniqueBarcodeList] WITH NOCHECK ADD
	CONSTRAINT [PK_HxUniqueBarcodeList] PRIMARY KEY CLUSTERED 
	(
		[Barcode] ASC,
		[UniqueBarcode] ASC
	) ON [PRIMARY]
GO

 CREATE  INDEX [IX_RunAction_RunID] ON [dbo].[HxRunAction]([RunID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_Deck_RunID] ON [dbo].[HxDeck]([RunID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_Deck] ON [dbo].[HxDeck]([ParentDeckID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_TADMCurve_ActionID] ON [dbo].[HxTADMCurve]([ActionID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_Labware_ParentElementID] ON [dbo].[HxLabware]([ParentElementID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_Labware_DeckID] ON [dbo].[HxLabware]([DeckID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_Labware_LabwareName] ON [dbo].[HxLabware]([LabwareName]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareAction_ActionID] ON [dbo].[HxLabwareAction]([ActionID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareAction_ElementID] ON [dbo].[HxLabwareAction]([ElementID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareAction_DeckID] ON [dbo].[HxLabwareAction]([DeckID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareExperiment_ElementID] ON [dbo].[HxLabwareExperiment]([ElementID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareExperiment_ExperimentID] ON [dbo].[HxLabwareExperiment]([ExperimentID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareRunData_InitialDeckID] ON [dbo].[HxLabwareRunData]([InitialDeckID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_LabwareRunData_InitialParentElementID] ON [dbo].[HxLabwareRunData]([InitialParentElementID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_SourceBarcodeList_ActionID] ON [dbo].[HxSourceBarcodeList]([ActionID]) ON [PRIMARY]
GO

 CREATE  INDEX [IX_SourceBarcodeList_ElementID] ON [dbo].[HxSourceBarcodeList]([ElementID]) ON [PRIMARY]
GO

ALTER TABLE [dbo].[HxAction] ADD 
	CONSTRAINT [FK_HxAction_HxError] FOREIGN KEY 
	(
		[ErrorID]
	) REFERENCES [dbo].[HxError] (
		[ErrorID]
	),
	CONSTRAINT [FK_HxAction_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

ALTER TABLE [dbo].[HxInstrumentAdditionalData] ADD 
	CONSTRAINT [FK_HxInstrumentAdditionalData_HxInstrument] FOREIGN KEY 
	(
		[InstrumentID]
	) REFERENCES [dbo].[HxInstrument] (
		[InstrumentID]
	)
GO

ALTER TABLE [dbo].[HxInstrumentConfiguration] ADD 
	CONSTRAINT [FK_HxInstrumentConfiguration_HxInstrument] FOREIGN KEY 
	(
		[InstrumentID]
	) REFERENCES [dbo].[HxInstrument] (
		[InstrumentID]
	)
GO

ALTER TABLE [dbo].[HxJobAdditionalData] ADD 
	CONSTRAINT [FK_HxJobAdditionalData_HxJob] FOREIGN KEY 
	(
		[JobID]
	) REFERENCES [dbo].[HxJob] (
		[JobID]
	)
GO

ALTER TABLE [dbo].[HxLabwareType] ADD 
	CONSTRAINT [FK_HxLabwareType_HxLabwareMainType] FOREIGN KEY 
	(
		[LabwareMainTypeID]
	) REFERENCES [dbo].[HxLabwareMainType] (
		[LabwareMainTypeID]
	)
GO

ALTER TABLE [dbo].[HxRunAction] ADD 
	CONSTRAINT [FK_HxRunAction_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

ALTER TABLE [dbo].[HxRunAdditionalData] ADD 
	CONSTRAINT [FK_HxRunAdditionalData_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

ALTER TABLE [dbo].[HxActionAddSourceBarcode] ADD 
	CONSTRAINT [FK_HxActionAddSourceBarcode_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionAdditionalData] ADD 
	CONSTRAINT [FK_HxActionAdditionalData_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionIncubate] ADD 
	CONSTRAINT [FK_HxActionIncubate_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionMove] ADD 
	CONSTRAINT [FK_HxActionMove_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionMoveVolume] ADD 
	CONSTRAINT [FK_HxActionMoveVolume_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	),
	CONSTRAINT [FK_HxActionMoveVolume_HxLiquidClass] FOREIGN KEY 
	(
		[LiquidClassID]
	) REFERENCES [dbo].[HxLiquidClass] (
		[LiquidClassID]
	)
GO

ALTER TABLE [dbo].[HxActionSetBarcode] ADD 
	CONSTRAINT [FK_HxActionSetBarcode_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionSetLabwareState] ADD 
	CONSTRAINT [FK_HxActionSetLabwareState_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxActionSetVolume] ADD 
	CONSTRAINT [FK_HxActionSetVolume_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxDeck] ADD 
	CONSTRAINT [FK_HxDeck_HxDeck] FOREIGN KEY 
	(
		[ParentDeckID]
	) REFERENCES [dbo].[HxDeck] (
		[DeckID]
	),
	CONSTRAINT [FK_HxDeck_HxInstrumentConfiguration] FOREIGN KEY 
	(
		[InstrumentConfigurationID]
	) REFERENCES [dbo].[HxInstrumentConfiguration] (
		[InstrumentConfigurationID]
	),
	CONSTRAINT [FK_HxDeck_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

ALTER TABLE [dbo].[HxInstrumentConfigurationAdditionalData] ADD 
	CONSTRAINT [FK_HxInstrumentConfigurationAdditionalData_HxInstrumentConfiguration] FOREIGN KEY 
	(
		[InstrumentConfigurationID]
	) REFERENCES [dbo].[HxInstrumentConfiguration] (
		[InstrumentConfigurationID]
	)
GO

ALTER TABLE [dbo].[HxRunActionAdditionalData] ADD 
	CONSTRAINT [FK_HxRunActionAdditionalData_HxRunAction] FOREIGN KEY 
	(
		[RunActionID]
	) REFERENCES [dbo].[HxRunAction] (
		[RunActionID]
	)
GO

ALTER TABLE [dbo].[HxTADMCurve] ADD 
	CONSTRAINT [FK_HxTADMCurve_HxActionMoveVolume] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxActionMoveVolume] (
		[ActionID]
	)
GO

ALTER TABLE [dbo].[HxLabware] ADD 
	CONSTRAINT [FK_HxLabware_HxDeck] FOREIGN KEY 
	(
		[DeckID]
	) REFERENCES [dbo].[HxDeck] (
		[DeckID]
	),
	CONSTRAINT [FK_HxLabware_HxLabware] FOREIGN KEY 
	(
		[ParentElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	),
	CONSTRAINT [FK_HxLabware_HxLabwareType] FOREIGN KEY 
	(
		[LabwareTypeID]
	) REFERENCES [dbo].[HxLabwareType] (
		[LabwareTypeID]
	)
GO

ALTER TABLE [dbo].[HxLabwareAction] ADD 
	CONSTRAINT [FK_HxLabwareAction_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	),
	CONSTRAINT [FK_HxLabwareAction_HxDeck] FOREIGN KEY 
	(
		[DeckID]
	) REFERENCES [dbo].[HxDeck] (
		[DeckID]
	),
	CONSTRAINT [FK_HxLabwareAction_HxLabware] FOREIGN KEY 
	(
		[ElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	)
GO

ALTER TABLE [dbo].[HxLabwareAdditionalData] ADD 
	CONSTRAINT [FK_HxLabwareAdditionalData_HxLabware] FOREIGN KEY 
	(
		[ElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	)
GO

ALTER TABLE [dbo].[HxLabwareExperiment] ADD 
	CONSTRAINT [FK_HxLabwareExperiment_HxExperiment] FOREIGN KEY 
	(
		[ExperimentID]
	) REFERENCES [dbo].[HxExperiment] (
		[ExperimentID]
	),
	CONSTRAINT [FK_HxLabwareExperiment_HxLabware] FOREIGN KEY 
	(
		[ElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	)
GO

ALTER TABLE [dbo].[HxLabwareRunData] ADD 
	CONSTRAINT [FK_HxLabwareRunData_HxDeck] FOREIGN KEY 
	(
		[InitialDeckID]
	) REFERENCES [dbo].[HxDeck] (
		[DeckID]
	),
	CONSTRAINT [FK_HxLabwareRunData_HxLabware] FOREIGN KEY 
	(
		[ElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	),
	CONSTRAINT [FK_HxLabwareRunData_HxLabware_Parent] FOREIGN KEY 
	(
		[InitialParentElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	),
	CONSTRAINT [FK_HxLabwareRunData_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

ALTER TABLE [dbo].[HxSourceBarcodeList] ADD 
	CONSTRAINT [FK_HxSourceBarcodeList_HxAction] FOREIGN KEY 
	(
		[ActionID]
	) REFERENCES [dbo].[HxAction] (
		[ActionID]
	),
	CONSTRAINT [FK_HxSourceBarcodeList_HxLabware] FOREIGN KEY 
	(
		[ElementID]
	) REFERENCES [dbo].[HxLabware] (
		[ElementID]
	)
GO

ALTER TABLE [dbo].[HxUniqueBarcodeList] ADD 
	CONSTRAINT [FK_HxUniqueBarcodeList_HxRun] FOREIGN KEY 
	(
		[RunID]
	) REFERENCES [dbo].[HxRun] (
		[RunID]
	)
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE VIEW dbo.GRUView
AS
SELECT     TOP 100 PERCENT dbo.HxLabware.ElementID, dbo.HxLabwareRunData.InitialAccessName, dbo.HxLabware.DeckID, dbo.HxAction.ActionType, dbo.HxLabware.LabwareState, 
                      dbo.HxLabware.Barcode, dbo.HxActionMoveVolume.Volume, dbo.HxActionMoveVolume.StepType, dbo.HxActionMoveVolume.ActionID, 
                      dbo.HxActionMoveVolume.ChannelNumber, dbo.HxTADMCurve.TADMCurveID, dbo.HxLabwareRunData.Interrupted, dbo.HxAction.ActionState
FROM         dbo.HxAction INNER JOIN
                      dbo.HxLabwareAction ON dbo.HxAction.ActionID = dbo.HxLabwareAction.ActionID LEFT OUTER JOIN
                      dbo.HxActionMoveVolume ON dbo.HxLabwareAction.ActionID = dbo.HxActionMoveVolume.ActionID RIGHT OUTER JOIN
                      dbo.HxLabwareRunData ON dbo.HxLabwareAction.ElementID = dbo.HxLabwareRunData.ElementID FULL OUTER JOIN
                      dbo.HxTADMCurve ON dbo.HxAction.ActionID = dbo.HxTADMCurve.ActionID RIGHT OUTER JOIN
                      dbo.HxLabware ON dbo.HxLabwareRunData.ElementID = dbo.HxLabware.ElementID
WHERE     (dbo.HxLabwareAction.Referenced = 1)
ORDER BY dbo.HxAction.ActionID, dbo.HxLabware.ElementID, dbo.HxAction.ActionType

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spClearUniqueBarcodes
AS
 SET NOCOUNT ON

BEGIN
 DELETE FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList];
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spClearUniqueBarcodes_LastUsedTime
(
 @LastUsedTime datetime
)
AS
 SET NOCOUNT ON

BEGIN
 DELETE FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] WHERE ([LastUsedTime] < @LastUsedTime);
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spCheckUniqueBarcode_RunID
(
 @Barcode        nvarchar(255),
 @RunID          bigint,
 @oUniqueBarcode bit OUTPUT
)
AS
 SET NOCOUNT ON

BEGIN
 SELECT TOP 1 @oUniqueBarcode = [UniqueBarcode] FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] WHERE ([Barcode]=@Barcode) AND ([RunID]=@RunID) ORDER BY [UniqueBarcode] DESC, [LastUsedTime] DESC;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spCheckUniqueBarcode_LastUsedTime
(
 @Barcode        nvarchar(255),
 @LastUsedTime   datetime,
 @oUniqueBarcode bit OUTPUT
)
AS
 SET NOCOUNT ON

BEGIN
 SELECT TOP 1 @oUniqueBarcode = [UniqueBarcode] FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] WHERE ([Barcode]=@Barcode) AND ([LastUsedTime]>@LastUsedTime) ORDER BY [UniqueBarcode] DESC, [LastUsedTime] DESC;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_Load
(
 @RunID             bigint,
 @ActionID          bigint,
 @DeckID            bigint,
 @ParentElementID   bigint,
 @InitialAccessName nvarchar(255),
 @LabwareName       nvarchar(255),
 @LabwareLevel      tinyint,
 @Barcode           nvarchar(255),
 @LabwareState      tinyint,
 @ActionState       tinyint,
 @DeckCoordinateX   float = NULL,
 @DeckCoordinateY   float = NULL,
 @DeckCoordinateZ   float = NULL,
 @UsageType         tinyint,
 @ElementID         bigint = 0,
 @LoadLabware       bit = 1,
 @oElementID        bigint output
)
AS
 SET NOCOUNT ON

BEGIN
 IF (@ElementID > 0)
 BEGIN
  EXEC spUpdateLabwareData @RunID, @ElementID, NULL, NULL, NULL, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, @LabwareName, @ParentElementID, @DeckID, @DeckCoordinateX, @DeckCoordinateY, @DeckCoordinateZ;
  SELECT @oElementID = @ElementID;
 END
 ELSE
 BEGIN
  EXEC spCreateLabware @RunID, @InitialAccessName, @ParentElementID, @DeckID, @LabwareName, @LabwareLevel, @Barcode, @LabwareState, @ActionState, @DeckCoordinateX, @DeckCoordinateY, @DeckCoordinateZ, @LoadLabware, @oElementID OUTPUT;
 END

 IF (@LoadLabware = 1)
 BEGIN
  EXEC spLinkLabware @oElementID, 0, 1, 0, @ActionID, @DeckID, @UsageType;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_Wash
(
 @RunID                  bigint,
 @ActionID               bigint,
 @ActionState            tinyint,
 @TargetElementID        bigint,
 @TargetConnected        bit,
 @LabwareState           tinyint,
 @ClearSourceBarcodeList bit
)
AS
 SET NOCOUNT ON
BEGIN
 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, -1, @ClearSourceBarcodeList, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spGetLiquidClassID
(
 @Name           nvarchar(100),
 @Version        varchar(10),
 @oLiquidClassID bigint OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 IF (@Name != '')
 BEGIN
  SELECT @oLiquidClassID = [LiquidClassID] FROM [HxLiquidClass] WHERE [Name]=@Name AND [Version]=@Version;
  IF (@oLiquidClassID IS NULL)
  BEGIN
   INSERT INTO [HxLiquidClass] ([Name], [Version]) VALUES (@Name, @Version);
   SELECT @oLiquidClassID = @@IDENTITY;
  END
 END
 ELSE
 BEGIN
  SELECT @oLiquidClassID = NULL;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spStartRun
(
 @UpdateIndex    bit,
 @MethodName     nvarchar(255),
 @RunGUID        char(32),
 @StartTime      datetime,
 @RunState       tinyint,
 @ComputerName   nvarchar(255),
 @PhoenixVersion varchar(20),
 @DBVersion      tinyint,
 @oRunID         bigint OUTPUT
)
AS
 SET NOCOUNT ON

BEGIN

 IF (@UpdateIndex = 0)
 BEGIN
  INSERT INTO [HxRun] ([MethodName], [RunGUID], [StartTime], [ComputerName], [RunState], [PhoenixVersion], [DBVersion])
               VALUES (@MethodName,  @RunGUID,  @StartTime,  @ComputerName,  @RunState,  @PhoenixVersion,  @DBVersion);

  SELECT @oRunID = @@IDENTITY;
 END
 ELSE
 BEGIN
  INSERT INTO [%%%VARIABLE_INDEXDBNAME%%%]..[HxRun] ([MethodName], [RunGUID], [StartTime], [ComputerName], [RunState], [PhoenixVersion], [DBVersion])
                                   VALUES (@MethodName,  @RunGUID,  @StartTime,  @ComputerName,  @RunState,  @PhoenixVersion,  @DBVersion);

  SELECT @oRunID = @@IDENTITY;

  SET IDENTITY_INSERT [HxRun] ON;

  INSERT INTO [HxRun] ([RunID], [MethodName], [RunGUID], [StartTime], [ComputerName], [RunState], [PhoenixVersion], [DBVersion])
               VALUES (@oRunID, @MethodName,  @RunGUID,  @StartTime,  @ComputerName,  @RunState,  @PhoenixVersion,  @DBVersion);

  SET IDENTITY_INSERT [HxRun] OFF;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUnassignSingleLabwareFromJobs
(
 @RunID     bigint,
 @ElementID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @JobStateAssigned    tinyint,
         @JobStateUnprocessed tinyint;
 SELECT @JobStateUnprocessed = 1; /* HxVectorDbJobState.Unprocessed */
 SELECT @JobStateAssigned    = 8; /* HxVectorDbJobState.Assigned    */
 UPDATE [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] SET [RunID] = NULL, [SourceElementID] = NULL, [TargetElementID] = NULL, [JobState] = @JobStateUnprocessed
            WHERE [RunID] = @RunID AND [JobState] = @JobStateAssigned AND (([SourceElementID] = @ElementID) OR ([TargetElementID] = @ElementID));
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUpdateRun
(
 @UpdateIndex     bit,
 @RunID           bigint,
 @RunState        tinyint,
 @EndTime         datetime = NULL,
 @oAffectedRows   int OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 IF (@UpdateIndex = 0)
 BEGIN
  UPDATE [HxRun] SET [RunState] = @RunState, [EndTime] = @EndTime WHERE [RunID] = @RunID;
  SELECT @oAffectedRows = @@ROWCOUNT;
 END
 ELSE
 BEGIN
  UPDATE [%%%VARIABLE_INDEXDBNAME%%%]..[HxRun] SET [RunState] = @RunState, [EndTime] = @EndTime WHERE [RunID] = @RunID;
  UPDATE [HxRun] SET [RunState] = @RunState, [EndTime] = @EndTime WHERE [RunID] = @RunID;
  SELECT @oAffectedRows = @@ROWCOUNT;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spAddErrorInfo
(
 @ActionID                  bigint,
 @InstrumentConfigurationID bigint,
 @ErrorCode                 nvarchar(25),
 @ErrorMessage              nvarchar(255)
)
AS
 SET NOCOUNT ON
DECLARE @ErrorID bigint;
BEGIN
  SELECT @ErrorID = [ErrorID] FROM [HxError] WHERE [ErrorCode]=@ErrorCode AND [ErrorMessage]=@ErrorMessage AND [InstrumentConfigurationID]=@InstrumentConfigurationID;
  IF (@ErrorID IS NULL)
  BEGIN
   INSERT INTO [HxError] ([ErrorCode], [ErrorMessage], [InstrumentConfigurationID]) VALUES (@ErrorCode, @ErrorMessage, @InstrumentConfigurationID);
   SELECT @ErrorID = @@IDENTITY;
  END
  UPDATE [HxAction] SET [ErrorID] = @ErrorID WHERE [ActionID] = @ActionID;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spCopyFinishedJobsOfRun
(
 @Index_RunID bigint,
 @Run_RunID   bigint
)
AS
 SET NOCOUNT ON
BEGIN
 SET IDENTITY_INSERT [HxJob] ON;
 INSERT INTO [HxJob] ([JobID], [JobName], [JobPriority], [JobState], [UserJobState], [RunID],    [SourceElementID], [SourceBarcode], [SourceLabwareId], [SourcePositionId], [SourceRequired], [TargetElementID], [TargetBarcode], [TargetLabwareId], [TargetPositionId], [TransportVolume])
              (SELECT [JobID], [JobName], [JobPriority], [JobState], [UserJobState], @Run_RunID, [SourceElementID], [SourceBarcode], [SourceLabwareId], [SourcePositionId], [SourceRequired], [TargetElementID], [TargetBarcode], [TargetLabwareId], [TargetPositionId], [TransportVolume] FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] WHERE [RunID] = @Index_RunID);
 SET IDENTITY_INSERT [HxJob] OFF;
 SET IDENTITY_INSERT [HxJobAdditionalData] ON;
 INSERT INTO [HxJobAdditionalData] ([JobAdditionalDataID], [JobID], [Key], [ValueType], [StringValue], [IntegerValue], [FloatValue])
                            (SELECT [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[JobAdditionalDataID], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[JobID], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[Key], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[ValueType], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[StringValue], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[IntegerValue], [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[FloatValue] FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData] INNER JOIN [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] ON [%%%VARIABLE_INDEXDBNAME%%%]..[HxJobAdditionalData].[JobID] = [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob].[JobID] WHERE [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob].[RunID] = @Index_RunID);
 SET IDENTITY_INSERT [HxJobAdditionalData] OFF;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spCreateAction
(
 @ActionType  tinyint,
 @ActionTime  datetime,
 @ActionState tinyint,
 @ActionGroup bigint,
 @RunID       bigint,
 @oActionID   bigint output
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxAction] ([ActionType], [ActionTime], [ActionState], [ActionGroup], [RunID])
               VALUES (@ActionType,  @ActionTime,  @ActionState,  @ActionGroup,  @RunID);
 SELECT @oActionID = @@IDENTITY;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spGetLabwareTypeID
(
 @LabwareMainTypeName nvarchar(50),
 @LabwareTypeName     nvarchar(50),
 @AllowCreate         bit,
 @oLabwareMainTypeID  bigint OUTPUT,
 @oLabwareTypeID      bigint OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 IF (@LabwareMainTypeName != '')
 BEGIN
  SELECT @oLabwareMainTypeID = [LabwareMainTypeID] FROM [HxLabwareMainType] WHERE [Name]=@LabwareMainTypeName;
  IF (@oLabwareMainTypeID IS NULL)
  BEGIN
   IF (@AllowCreate > 0)
   BEGIN
    INSERT INTO [HxLabwareMainType] ([Name]) VALUES (@LabwareMainTypeName);
    SELECT @oLabwareMainTypeID = @@IDENTITY;
   END
   ELSE
   BEGIN
    SELECT @oLabwareMainTypeID = NULL;
   END
  END
 END
 ELSE
 BEGIN
  SELECT @oLabwareMainTypeID = NULL;
 END
 IF (@LabwareTypeName != '')
 BEGIN
  SELECT @oLabwareTypeID = [LabwareTypeID] FROM [HxLabwareType] WHERE [Name]=@LabwareTypeName AND [LabwareMainTypeID] = @oLabwareMainTypeID;
  IF (@oLabwareTypeID IS NULL)
  BEGIN
   IF (@AllowCreate > 0)
   BEGIN
    INSERT INTO [HxLabwareType] ([LabwareMainTypeID], [Name]) VALUES (@oLabwareMainTypeID, @LabwareTypeName);
    SELECT @oLabwareTypeID = @@IDENTITY;
   END
   ELSE
   BEGIN
    SELECT @oLabwareTypeID = NULL;
   END
  END
 END
 ELSE
 BEGIN
  SELECT @oLabwareTypeID     = NULL;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_MoveVolume
(
 @RunID              bigint,
 @ActionID           bigint,
 @ActionState        tinyint,
 @SourceElementID    bigint,
 @SourceConnected    bit,
 @TargetElementID    bigint,
 @TargetConnected    bit,
 @TargetLabwareState tinyint,
 @Volume             float,
 @StepType           tinyint,
 @ChannelNumber      smallint,
 @LiquidClassName    nvarchar(100),
 @LiquidClassVersion varchar(10),
 @ClearSourceIfEmpty bit,
 @oSourceWasCleared  bit OUTPUT
)
AS
 SET NOCOUNT ON
DECLARE @SourceLabwareVolume AS float
DECLARE @TargetLabwareVolume AS float
DECLARE @LiquidClassID AS bigint
BEGIN
 EXEC spGetLiquidClassID @LiquidClassName, @LiquidClassVersion, @LiquidClassID OUTPUT;
 EXEC spTrackAction_MoveVolume_LiquidClassID @RunID, @ActionID, @ActionState, @SourceElementID, @SourceConnected, @TargetElementID, @TargetConnected, @TargetLabwareState, @Volume, @StepType, @ChannelNumber, @LiquidClassID, @ClearSourceIfEmpty, @oSourceWasCleared OUTPUT;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_Incubate
(
 @RunID        bigint,
 @ActionID     bigint,
 @ActionState  tinyint,
 @ElementID    bigint,
 @Connected    bit,
 @LabwareState tinyint,
 @Duration     float,
 @Temperature  float
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxActionIncubate] ([ActionID], [Duration], [Temperature])
                       VALUES (@ActionID,  @Duration,  @Temperature);
 EXEC spUpdateLabwareData @RunID, @ElementID, @Connected, 1, 0, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_Move
(
 @RunID                 bigint,
 @ActionID              bigint,
 @ActionState           tinyint,
 @ElementID             bigint,
 @LabwareState          tinyint,
 @DeckID                bigint,
 @LabwareName           varchar(255),
 @DeckCoordinateX       float = NULL,
 @DeckCoordinateY       float = NULL,
 @DeckCoordinateZ       float = NULL,
 @SourceParentElementID bigint,
 @TargetParentElementID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxActionMove] ([ActionID], [SourceParentElementID], [TargetParentElementID])
                   VALUES (@ActionID,  @SourceParentElementID,  @TargetParentElementID);
 EXEC spUpdateLabwareData @RunID, @ElementID, 0, 1, 0, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, @LabwareName, @TargetParentElementID, @DeckID, @DeckCoordinateX, @DeckCoordinateY, @DeckCoordinateZ;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackUniqueBarcode
(
 @ActionID bigint,
 @Barcode nvarchar(255),
 @UniqueBarcode bit
)
AS
 SET NOCOUNT ON;

 DECLARE @RunID      bigint;
 DECLARE @ActionTime datetime;

BEGIN
 SELECT @RunID = [RunID], @ActionTime = [ActionTime] FROM [HxAction] WHERE [ActionID] = @ActionID;

 IF ((SELECT COUNT([Barcode]) FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] WHERE [Barcode] = @Barcode AND [UniqueBarcode] = @UniqueBarcode) > 0)
 BEGIN
  UPDATE [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] SET [LastUsedTime] = @ActionTime, [RunID] = @RunID WHERE [Barcode] = @Barcode AND [UniqueBarcode] = @UniqueBarcode;
 END
 ELSE
 BEGIN
  INSERT INTO [%%%VARIABLE_INDEXDBNAME%%%]..[HxUniqueBarcodeList] ([Barcode], [UniqueBarcode], [LastUsedTime], [RunID]) VALUES (@Barcode, @UniqueBarcode, @ActionTime, @RunID);
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_SetBarcode
(
 @RunID              bigint,
 @ActionID           bigint,
 @ActionState        tinyint,
 @TargetElementID    bigint,
 @TargetConnected    bit,
 @TargetLabwareState tinyint,
 @Barcode            nvarchar(255),
 @UniqueBarcode      bit = 0,
 @TrackUniqueBarcode bit = 0
)
AS
 SET NOCOUNT ON

BEGIN
 INSERT INTO [HxActionSetBarcode] ([ActionID], [Barcode])
                           VALUES (@ActionID,  @Barcode);

 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, 0, 0, @TargetLabwareState, @ActionState, NULL, NULL, @Barcode, NULL, NULL, NULL, NULL, NULL, NULL, NULL; 

 IF (@TrackUniqueBarcode > 0)
 BEGIN
  EXEC spTrackUniqueBarcode @ActionID, @Barcode, @UniqueBarcode;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_SetLabwareState
(
 @RunID           bigint,
 @ActionID        bigint,
 @ActionState     tinyint,
 @TargetElementID bigint,
 @TargetConnected bit,
 @LabwareState    tinyint
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxActionSetLabwareState] ([ActionID], [LabwareState])
                              VALUES (@ActionID,  @LabwareState);
 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, 0, 0, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_SetVolume
(
 @RunID           bigint,
 @ActionID        bigint,
 @ActionState     tinyint,
 @TargetElementID bigint,
 @TargetConnected bit,
 @Volume          float,
 @LabwareState    tinyint
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxActionSetVolume] ([ActionID], [Volume])
                        VALUES (@ActionID,  @Volume);
 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, 0, 0, @LabwareState, @ActionState, NULL, NULL, NULL, @Volume, NULL, NULL, NULL, NULL, NULL, NULL;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUpdateTADMCurveID
(
 @ActionID     bigint,
 @TADMCurveID  int,
 @oActionFound bit OUTPUT
)
AS
BEGIN
 SELECT @oActionFound = 0;
 IF EXISTS (SELECT * FROM [HxActionMoveVolume] WHERE [ActionID] = @ActionID)
 BEGIN
  INSERT INTO [HxTADMCurve] ([ActionID], [TADMCurveID]) VALUES (@ActionID, @TADMCurveID);
  SELECT @oActionFound = 1;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spAssignLabwareToJobs
(
 @RunID  bigint,
 @DeckID bigint
)
AS
 SET NOCOUNT OFF

BEGIN
 DECLARE @SourceFilterActive  bit,
         @TargetFilterActive  bit,
         @JobStateUnprocessed tinyint,
         @JobStateAssigned    tinyint,
         @SourceElementID     bigint,
         @TargetElementID     bigint,
         @JobID               bigint,
         @SourceBarcode       nvarchar(255),
         @SourceLabwareId     nvarchar(255),
         @SourcePositionId    nvarchar(50),
         @SourceRequired      bit,
         @TargetBarcode       nvarchar(255),
         @TargetLabwareId     nvarchar(255),
         @TargetPositionId    nvarchar(50)

 SELECT @JobStateUnprocessed = 1; /* HxVectorDbJobState.Unprocessed */
 SELECT @JobStateAssigned    = 8; /* HxVectorDbJobState.Assigned */

 SELECT @SourceFilterActive = 0;
 SELECT @TargetFilterActive = 0;

 DECLARE cursorOpenJobs CURSOR LOCAL FAST_FORWARD FOR
 SELECT [JobID], [SourceBarcode], [SourceLabwareId], [SourcePositionId], [SourceRequired], [TargetBarcode], [TargetLabwareId], [TargetPositionId] FROM [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] WHERE (([JobState] = @JobStateUnprocessed) OR (([RunID] = @RunID) AND ([JobState] = @JobStateAssigned)));

 OPEN cursorOpenJobs
 FETCH NEXT FROM cursorOpenJobs
 INTO @JobID, @SourceBarcode, @SourceLabwareId, @SourcePositionId, @SourceRequired, @TargetBarcode, @TargetLabwareId, @TargetPositionId
 WHILE (@@FETCH_STATUS = 0)
 BEGIN
  SELECT @SourceElementID = NULL;
  SELECT @TargetElementID = NULL;

  SELECT @SourceBarcode    = ISNULL(@SourceBarcode,    '');
  SELECT @SourceLabwareId  = ISNULL(@SourceLabwareId,  '');
  SELECT @SourcePositionId = ISNULL(@SourcePositionId, '');
  SELECT @TargetBarcode    = ISNULL(@TargetBarcode,    '');
  SELECT @TargetLabwareId  = ISNULL(@TargetLabwareId,  '');
  SELECT @TargetPositionId = ISNULL(@TargetPositionId, '');

  IF ((@SourceBarcode != '') AND (@SourceLabwareId != '') AND (@SourcePositionId != ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [pLabware].[ElementID]
   FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
   WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@SourceLabwareId) AND ([pLabware].[LabwareName]=@SourcePositionId) AND ([pLabware].[Barcode]=@SourceBarcode));
   IF (@SourceElementID IS NULL)
   BEGIN
    SELECT @SourceElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@SourceLabwareId) AND ([pLabware].[LabwareName]=@SourcePositionId) AND ([lLabware].[Barcode]=@SourceBarcode));
   END

  END
  ELSE IF ((@SourceBarcode != '') AND (@SourceLabwareId != '') AND (@SourcePositionId = ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [ElementID] FROM [HxLabware] WHERE (([DeckID] = @DeckID) AND ([Barcode] = @SourceBarcode) AND ([LabwareName] = @SourceLabwareId));
   IF (@SourceElementID IS NULL)
   BEGIN
    SELECT @SourceElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@SourceLabwareId) AND ([pLabware].[Barcode]=@SourceBarcode));
   END

  END
  ELSE IF ((@SourceBarcode != '') AND (@SourceLabwareId = '') AND (@SourcePositionId != ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [ElementID] FROM [HxLabware] WHERE (([DeckID] = @DeckID) AND ([Barcode] = @SourceBarcode) AND ([LabwareName] = @SourcePositionId));
   IF (@SourceElementID IS NULL)
   BEGIN
    SELECT @SourceElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([pLabware].[LabwareName]=@SourcePositionId) AND ([lLabware].[Barcode]=@SourceBarcode));
   END

  END
  ELSE IF ((@SourceBarcode != '') AND (@SourceLabwareId = '') AND (@SourcePositionId = ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [ElementID] FROM [HxLabware] WHERE ([DeckID] = @DeckID) AND ([Barcode] = @SourceBarcode);

  END
  ELSE IF ((@SourceBarcode = '') AND (@SourceLabwareId != '') AND (@SourcePositionId != ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [pLabware].[ElementID]
   FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
   WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@SourceLabwareId) AND ([pLabware].[LabwareName]=@SourcePositionId));

  END
  ELSE IF ((@SourceBarcode = '') AND (@SourceLabwareId != '') AND (@SourcePositionId = ''))
  BEGIN

   SELECT @SourceFilterActive = 1;
   SELECT @SourceElementID = [ElementID] FROM [HxLabware] WHERE ([DeckID] = @DeckID) AND ([LabwareName] = @SourceLabwareId);

  END

  IF ((@TargetBarcode != '') AND (@TargetLabwareId != '') AND (@TargetPositionId != ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [pLabware].[ElementID]
   FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
   WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@TargetLabwareId) AND ([pLabware].[LabwareName]=@TargetPositionId) AND ([pLabware].[Barcode]=@TargetBarcode));
   IF (@TargetElementID IS NULL)
   BEGIN
    SELECT @TargetElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@TargetLabwareId) AND ([pLabware].[LabwareName]=@TargetPositionId) AND ([lLabware].[Barcode]=@TargetBarcode));
   END

  END
  ELSE IF ((@TargetBarcode != '') AND (@TargetLabwareId != '') AND (@TargetPositionId = ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [ElementID] FROM [HxLabware] WHERE (([DeckID] = @DeckID) AND ([Barcode] = @TargetBarcode) AND ([LabwareName] = @TargetLabwareId));
   IF (@TargetElementID IS NULL)
   BEGIN
    SELECT @TargetElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@TargetLabwareId) AND ([pLabware].[Barcode]=@TargetBarcode));
   END

  END
  ELSE IF ((@TargetBarcode != '') AND (@TargetLabwareId = '') AND (@TargetPositionId != ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [ElementID] FROM [HxLabware] WHERE (([DeckID] = @DeckID) AND ([Barcode] = @TargetBarcode) AND ([LabwareName] = @TargetPositionId));
   IF (@TargetElementID IS NULL)
   BEGIN
    SELECT @TargetElementID = [pLabware].[ElementID]
    FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
    WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([pLabware].[LabwareName]=@TargetPositionId) AND ([lLabware].[Barcode]=@TargetBarcode));
   END

  END
  ELSE IF ((@TargetBarcode != '') AND (@TargetLabwareId = '') AND (@TargetPositionId = ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [ElementID] FROM [HxLabware] WHERE ([DeckID] = @DeckID) AND ([Barcode] = @TargetBarcode);

  END
  ELSE IF ((@TargetBarcode = '') AND (@TargetLabwareId != '') AND (@TargetPositionId != ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [pLabware].[ElementID]
   FROM [HxLabware] lLabware INNER JOIN [HxLabware] pLabware ON [pLabware].[ParentElementID] = [lLabware].[ElementID]
   WHERE (([lLabware].[DeckID] = @DeckID) AND ([pLabware].[DeckID] = @DeckID) AND ([lLabware].[LabwareName]=@TargetLabwareId) AND ([pLabware].[LabwareName]=@TargetPositionId));

  END
  ELSE IF ((@TargetBarcode = '') AND (@TargetLabwareId != '') AND (@TargetPositionId = ''))
  BEGIN

   SELECT @TargetFilterActive = 1;
   SELECT @TargetElementID = [ElementID] FROM [HxLabware] WHERE ([DeckID] = @DeckID) AND ([LabwareName] = @TargetLabwareId);

  END

  IF (((@SourceFilterActive = 0) OR ((@SourceFilterActive = 1) AND (@SourceElementID IS NOT NULL))) AND ((@TargetFilterActive = 0) OR ((@TargetFilterActive = 1) AND (@TargetElementID IS NOT NULL))))
  BEGIN
   IF ((@SourceElementID IS NOT NULL) OR (@TargetElementID IS NOT NULL))
   BEGIN
    UPDATE [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] SET [RunID] = @RunID, [SourceElementID] = @SourceElementID, [TargetElementID] = @TargetElementID, [JobState] = @JobStateAssigned WHERE [JobID] = @JobID;
   END
  END

  FETCH NEXT FROM cursorOpenJobs
  INTO @JobID, @SourceBarcode, @SourceLabwareId, @SourcePositionId, @SourceRequired, @TargetBarcode, @TargetLabwareId, @TargetPositionId
 END
 CLOSE cursorOpenJobs
 DEALLOCATE cursorOpenJobs
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spCreateLabware
(
 @RunID             bigint,
 @InitialAccessName nvarchar(255),
 @ParentElementID   bigint,
 @DeckID            bigint,
 @LabwareName       nvarchar(255),
 @LabwareLevel      tinyint,
 @Barcode           nvarchar(255),
 @LabwareState      tinyint,
 @ActionState       tinyint,
 @DeckCoordinateX   float = NULL,
 @DeckCoordinateY   float = NULL,
 @DeckCoordinateZ   float = NULL,
 @LoadLabware       bit = 1,
 @oElementID        bigint output
)
AS
 SET NOCOUNT ON

BEGIN

 IF (@LoadLabware = 1)
 BEGIN
  INSERT INTO [HxLabware] ([ParentElementID], [DeckID], [LabwareName], [LabwareLevel], [Barcode], [LabwareState], [DeckCoordinateX], [DeckCoordinateY], [DeckCoordinateZ])
  VALUES                  (@ParentElementID,  @DeckID,  @LabwareName,  @LabwareLevel,  @Barcode,  @LabwareState,  @DeckCoordinateX,  @DeckCoordinateY,  @DeckCoordinateZ);
 END
 ELSE
 BEGIN
  INSERT INTO [HxLabware] ([ParentElementID], [DeckID], [LabwareName], [LabwareLevel], [Barcode], [LabwareState], [DeckCoordinateX], [DeckCoordinateY], [DeckCoordinateZ])
  VALUES                  (@ParentElementID,  NULL,     @LabwareName,  @LabwareLevel,  @Barcode,  @LabwareState,  @DeckCoordinateX,  @DeckCoordinateY,  @DeckCoordinateZ);
 END

 SELECT @oElementID = @@IDENTITY;

 INSERT INTO [HxLabwareRunData] ([ElementID], [RunID], [LabwareState], [LastActionState], [Interrupted], [Aborted], [ProcessedSteps], [ExpectedProcessedSteps], [Barcode], [InitialAccessName], [InitialLabwareName], [InitialDeckID], [InitialParentElementID])
 VALUES                         (@oElementID, @RunID,  @LabwareState,  @ActionState,       0,             0,         0,                0,                       @Barcode,  @InitialAccessName,  @LabwareName,         @DeckID,         @ParentElementID);
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spDeleteLabwareType_LabwareTypeID
(
 @LabwareTypeID bigint,
 @oAffectedRows int OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @tmpElementID AS bigint;
 DECLARE cursorLabwares CURSOR LOCAL FAST_FORWARD FOR
 SELECT [ElementID] FROM [HxLabware] WHERE [LabwareTypeID] = @LabwareTypeID;
 OPEN cursorLabwares
 FETCH NEXT FROM cursorLabwares
 INTO @tmpElementID
 WHILE (@@FETCH_STATUS = 0)
 BEGIN
  UPDATE [HxLabware] SET [LabwareTypeID] = NULL WHERE [LabwareTypeID] = @LabwareTypeID;
  FETCH NEXT FROM cursorLabwares
  INTO @tmpElementID
 END
 CLOSE cursorLabwares
 DEALLOCATE cursorLabwares
 DELETE FROM [HxLabwareType] WHERE [LabwareTypeID] = @LabwareTypeID;
 SELECT @oAffectedRows = @@ROWCOUNT;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spSetLabwareType_LabwareTypeID
(
 @ElementID     bigint,
 @LabwareTypeID bigint,
 @oOK           bit OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 UPDATE [HxLabware] SET [LabwareTypeID] = @LabwareTypeID WHERE [ElementID] = @ElementID;
 IF (@@ROWCOUNT > 0)
 BEGIN
  SELECT @oOK = 1;
 END
 ELSE
 BEGIN
  SELECT @oOK = 0;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUnassignLabwareFromJobs
(
 @RunID  bigint,
 @DeckID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @JobStateAssigned    tinyint,
         @JobStateUnprocessed tinyint;
 SELECT @JobStateUnprocessed = 1; /* HxVectorDbJobState.Unprocessed */
 SELECT @JobStateAssigned    = 8; /* HxVectorDbJobState.Assigned    */
 UPDATE [%%%VARIABLE_INDEXDBNAME%%%]..[HxJob] SET [RunID] = NULL, [SourceElementID] = NULL, [TargetElementID] = NULL, [JobState] = @JobStateUnprocessed
            WHERE [JobState] = @JobStateAssigned AND [RunID] = @RunID
              AND (
                    ([SourceElementID] IN (SELECT [ElementID] FROM [HxLabware] WHERE [DeckID] = @DeckID))
                    OR
                    ([TargetElementID] IN (SELECT [ElementID] FROM [HxLabware] WHERE [DeckID] = @DeckID))
                  );
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUnloadLabware
(
 @RunID     bigint,
 @ElementID bigint
)
AS
SET NOCOUNT ON
DECLARE @tmpElementID AS bigint
BEGIN
 DECLARE my_cursor CURSOR LOCAL FAST_FORWARD FOR
 SELECT [ElementID] FROM [HxLabware] WHERE [ParentElementID] = @ElementID;
 OPEN my_cursor
 FETCH NEXT FROM my_cursor INTO @tmpElementID
 WHILE @@FETCH_STATUS = 0
 BEGIN
  EXEC spUnloadLabware @tmpElementID
  FETCH NEXT FROM my_cursor INTO @tmpElementID
 END
 CLOSE my_cursor
 DEALLOCATE my_cursor
 
 UPDATE [HxLabware] SET [DeckID]=NULL WHERE [ElementID] = @ElementID;
 EXEC spUnassignSingleLabwareFromJobs @RunID, @ElementID;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spClearExperimentList
(
 @ElementID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 DELETE FROM [HxLabwareExperiment] WHERE [ElementID] = @ElementID AND [ExperimentSource] = 0;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spClearSourceBarcodeList
(
 @ElementID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 DELETE FROM [HxSourceBarcodeList] WHERE [ElementID] = @ElementID;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spDeleteLabwareMainType_LabwareMainTypeID
(
 @LabwareMainTypeID bigint,
 @oAffectedRows     int OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @tmpLabwareTypeID AS bigint;
 DECLARE @tmpAffectedRows  AS int;
 DECLARE cursorLabwareTypes CURSOR LOCAL FAST_FORWARD FOR
 SELECT [LabwareTypeID] FROM [HxLabwareType] WHERE [LabwareMainTypeID] = @LabwareMainTypeID;
 OPEN cursorLabwareTypes
 FETCH NEXT FROM cursorLabwareTypes
 INTO @tmpLabwareTypeID
 WHILE (@@FETCH_STATUS = 0)
 BEGIN
  EXEC spDeleteLabwareType_LabwareTypeID @tmpLabwareTypeID, @tmpAffectedRows OUTPUT;
  FETCH NEXT FROM cursorLabwareTypes
  INTO @tmpLabwareTypeID
 END
 CLOSE cursorLabwareTypes
 DEALLOCATE cursorLabwareTypes
 DELETE FROM [HxLabwareMainType] WHERE [LabwareMainTypeID] = @LabwareMainTypeID;
 SELECT @oAffectedRows = @@ROWCOUNT;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spDeleteLabwareType
(
 @LabwareMainTypeName nvarchar(50),
 @LabwareTypeName     nvarchar(50),
 @oAffectedRows       int OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @LabwareMainTypeID AS bigint;
 DECLARE @LabwareTypeID AS bigint;
 EXEC spGetLabwareTypeID @LabwareMainTypeName, @LabwareTypeName, 0, @LabwareMainTypeID OUTPUT, @LabwareTypeID OUTPUT;
 IF (@LabwareTypeID IS NULL)
 BEGIN
  SELECT @oAffectedRows = -1;
 END
 ELSE
 BEGIN
  EXEC spDeleteLabwareType_LabwareTypeID @LabwareTypeID, @oAffectedRows OUTPUT;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spLinkLabware
(
 @ElementID              bigint,
 @Connected              bit,
 @Referenced             bit,
 @LinkChildren           bit,
 @ActionID               bigint,
 @DeckID                 bigint,
 @UsageType              tinyint,
 @IgnoreUnloadedChildren bit = 0
)
AS
 SET NOCOUNT ON
BEGIN
 IF (@Connected = 0)
 BEGIN
  INSERT INTO [HxLabwareAction] ([ElementID], [ActionID], [DeckID], [UsageType], [Referenced])
                         VALUES (@ElementID,  @ActionID,  @DeckID,  @UsageType,  @Referenced);

  IF (@LinkChildren = 1)
  BEGIN
   DECLARE @tmpElementID AS bigint
  DECLARE @tmpDeckID AS bigint
   DECLARE my_cursor CURSOR LOCAL FAST_FORWARD FOR
   SELECT [ElementID], [DeckID] FROM [HxLabware] WHERE [ParentElementID] = @ElementID
   OPEN my_cursor
   FETCH NEXT FROM my_cursor INTO @tmpElementID, @tmpDeckID
   WHILE @@FETCH_STATUS = 0
   BEGIN
    IF ((@IgnoreUnloadedChildren = 0) OR (@tmpDeckID IS NOT NULL))
    BEGIN
     EXEC spLinkLabware @tmpElementID, 0, 0, 1, @ActionID, @DeckID, @UsageType, @IgnoreUnloadedChildren;
    END
    FETCH NEXT FROM my_cursor INTO @tmpElementID, @tmpDeckID
   END
   CLOSE my_cursor
   DEALLOCATE my_cursor
  END
 END
 ELSE
 BEGIN
  DECLARE @ParentElementID AS bigint
  SELECT @ParentElementID = [ParentElementID] FROM [HxLabware] WHERE [ElementID] = @ElementID;
  EXEC spLinkLabware @ParentElementID, 0, 0, @LinkChildren, @ActionID, @DeckID, @UsageType, @IgnoreUnloadedChildren;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spSetLabwareType
(
 @ElementID           bigint,
 @LabwareMainTypeName nvarchar(50),
 @LabwareTypeName     nvarchar(50),
 @AllowCreate         bit,
 @oLabwareTypeID      bigint OUTPUT,
 @oOK                 bit OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @LabwareMainTypeID AS bigint
 EXEC spGetLabwareTypeID @LabwareMainTypeName, @LabwareTypeName, 1, @LabwareMainTypeID OUTPUT, @oLabwareTypeID OUTPUT;
 EXEC spSetLabwareType_LabwareTypeID @ElementID, @oLabwareTypeID, @oOK OUTPUT
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spStartExperiment
(
 @ExperimentName            nvarchar(50),
 @ExperimentDescription     nvarchar(255),
 @ExperimentTime            datetime,
 @ExperimentSourceElementID bigint,
 @oExperimentID             bigint OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxExperiment] ([Name],          [Description],          [ExperimentTime])
                   VALUES (@ExperimentName, @ExperimentDescription, @ExperimentTime);
 SELECT @oExperimentID = @@IDENTITY;
 INSERT INTO [HxLabwareExperiment] ([ElementID],                [ExperimentID], [ExperimentSource])
                          VALUES (@ExperimentSourceElementID, @oExperimentID,  1);
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUpdateExperimentLabware
(
 @SourceElementID bigint,
 @TargetElementID bigint
)
AS
 SET NOCOUNT ON
BEGIN
 INSERT INTO [HxLabwareExperiment] ([ElementID],      [ExperimentID], [ExperimentSource])
                           SELECT @TargetElementID, [ExperimentID], 0 
                           FROM [HxLabwareExperiment]
                           WHERE ([ElementID] = @SourceElementID) AND
                                 ([ExperimentID] NOT IN (SELECT [ExperimentID] FROM [HxLabwareExperiment] WHERE [ElementID] = @TargetElementID))
                           GROUP BY ExperimentID;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUpdateSourceBarcodeList
(
 @SourceElementID       bigint,
 @SourceBarcode         nvarchar(255),
 @TargetElementID       bigint,
 @TargetConnected       bit,
 @TargetParentElementID bigint,
 @ActionID              bigint
)
AS
 SET NOCOUNT ON

BEGIN
 IF (@TargetConnected = 0)
 BEGIN
  INSERT INTO [HxSourceBarcodeList] ([ActionID], [ElementID], [Barcode]) (SELECT @ActionID, @TargetElementID, [Barcode] FROM (SELECT TOP 100 PERCENT [Barcode] FROM [HxSourceBarcodeList] WHERE (([ElementID] = @SourceElementID) AND ([Barcode] != @SourceBarcode) AND ([Barcode] NOT IN (SELECT [Barcode] FROM [HxLabware] WHERE ([ElementID] = @TargetElementID)))) ORDER BY [SourceBarcodeListID] ASC) AS [tmpSourceBarcodeList] GROUP BY [Barcode]);

  IF (@SourceBarcode != '')
  BEGIN
   INSERT INTO [HxSourceBarcodeList] ([ActionID], [ElementID], [Barcode]) VALUES (@ActionID, @TargetElementID, @SourceBarcode);
  END
 END
 ELSE
 BEGIN
  INSERT INTO [HxSourceBarcodeList] ([ActionID], [ElementID], [Barcode]) (SELECT @ActionID, @TargetParentElementID, [Barcode] FROM (SELECT TOP 100 PERCENT [Barcode] FROM [HxSourceBarcodeList] WHERE (([ElementID] = @SourceElementID) AND ([Barcode] != @SourceBarcode) AND ([Barcode] NOT IN (SELECT [Barcode] FROM [HxLabware] WHERE ([ElementID] = @TargetParentElementID)))) ORDER BY [SourceBarcodeListID] ASC) AS [tmpSourceBarcodeList] GROUP BY [Barcode]);

  IF (@SourceBarcode != '')
  BEGIN
   INSERT INTO [HxSourceBarcodeList] ([ActionID], [ElementID], [Barcode]) VALUES (@ActionID, @TargetParentElementID, @SourceBarcode);
  END
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spDeleteLabwareMainType
(
 @LabwareMainTypeName nvarchar(50),
 @oAffectedRows       int OUTPUT
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @LabwareMainTypeID AS bigint;
 SELECT @LabwareMainTypeID = [LabwareMainTypeID] FROM [HxLabwareMainType] WHERE [Name]=@LabwareMainTypeName;
 IF (@LabwareMainTypeID IS NULL)
 BEGIN
  SELECT @oAffectedRows = -1;
 END
 ELSE
 BEGIN
  EXEC spDeleteLabwareMainType_LabwareMainTypeID @LabwareMainTypeID, @oAffectedRows OUTPUT;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_AddSourceBarcode
(
 @RunID           bigint,
 @ActionID        bigint,
 @ActionState     tinyint,
 @TargetElementID bigint,
 @TargetConnected bigint,
 @SourceBarcode   nvarchar(255),
 @LabwareState    tinyint
)
AS
 SET NOCOUNT ON
BEGIN
 DECLARE @TargetParentElementID AS bigint
 SELECT @TargetParentElementID = [ParentElementID] FROM [HxLabware] WHERE [ElementID]=@TargetElementID;
 INSERT INTO [HxActionAddSourceBarcode] ([ActionID], [SourceBarcode])
                               VALUES (@ActionID,  @SourceBarcode);
 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, 0, 0, @LabwareState, @ActionState, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
 EXEC spUpdateSourceBarcodeList 0, @SourceBarcode, @TargetElementID, @TargetConnected, @TargetParentElementID, @ActionID;
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spTrackAction_MoveVolume_LiquidClassID
(
 @RunID              bigint,
 @ActionID           bigint,
 @ActionState        tinyint,
 @SourceElementID    bigint,
 @SourceConnected    bit,
 @TargetElementID    bigint,
 @TargetConnected    bit,
 @TargetLabwareState tinyint,
 @Volume             float,
 @StepType           tinyint,
 @ChannelNumber      smallint,
 @LiquidClassID      bigint,
 @ClearSourceIfEmpty bit,
 @oSourceWasCleared  bit OUTPUT
)
AS
 SET NOCOUNT ON
DECLARE @SourceLabwareVolume float
DECLARE @TargetLabwareVolume float
DECLARE @SourceBarcode nvarchar(255)
DECLARE @TargetParentElementID bigint
BEGIN
 SELECT @SourceLabwareVolume = ISNULL([Volume], 0.0), @SourceBarcode = [Barcode] FROM [HxLabware] WHERE [ElementID]=@SourceElementID;
 SELECT @TargetLabwareVolume = ISNULL([Volume], 0.0), @TargetParentElementID = [ParentElementID] FROM [HxLabware] WHERE [ElementID]=@TargetElementID;
 SELECT @SourceLabwareVolume = @SourceLabwareVolume - @Volume;
 SELECT @TargetLabwareVolume = @TargetLabwareVolume + @Volume;
 EXEC spUpdateLabwareData @RunID, @SourceElementID, @SourceConnected, 1, 0, NULL, NULL, NULL, NULL, NULL, @SourceLabwareVolume, NULL, NULL, NULL, NULL, NULL, NULL;
 EXEC spUpdateLabwareData @RunID, @TargetElementID, @TargetConnected, 1, 0, @TargetLabwareState, @ActionState, NULL, NULL, NULL, @TargetLabwareVolume, NULL, NULL, NULL, NULL, NULL, NULL;
 EXEC spUpdateSourceBarcodeList @SourceElementID, @SourceBarcode, @TargetElementID, @TargetConnected, @TargetParentElementID, @ActionID;
 EXEC spUpdateExperimentLabware @SourceElementID, @TargetElementID;
 INSERT INTO [HxActionMoveVolume] ([ActionID], [SourceLabwareVolume], [TargetLabwareVolume], [Volume], [StepType], [ChannelNumber], [LiquidClassID])
                         VALUES (@ActionID,  @SourceLabwareVolume,  @TargetLabwareVolume,  @Volume,  @StepType,  @ChannelNumber,  @LiquidClassID);
 IF ((@ClearSourceIfEmpty = 1) AND (@SourceLabwareVolume = 0))
 BEGIN
  EXEC spUpdateLabwareData @RunID, @SourceElementID, @SourceConnected, -1, 1, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL;
  SELECT @oSourceWasCleared = 1;
 END
 ELSE
 BEGIN
  SELECT @oSourceWasCleared = 0;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO

SET QUOTED_IDENTIFIER ON 
GO
SET ANSI_NULLS ON 
GO

CREATE PROCEDURE spUpdateLabwareData
(
 @RunID                   bigint,
 @ElementID               bigint,
 @Connected               bit = NULL,
 @IncrementProcessedSteps bit = NULL,
 @ClearSourceBarcodeList  bit = NULL,
 @LabwareState            tinyint = NULL,
 @ActionState             tinyint = NULL,
 @Interrupted             bit = NULL,
 @Aborted                 bit = NULL,
 @Barcode                 nvarchar(255) = NULL,
 @Volume                  float = NULL,
 @LabwareName             nvarchar(255) = NULL,
 @ParentElementID         bigint = NULL,
 @DeckID                  bigint = NULL,
 @DeckCoordinateX         float = NULL,
 @DeckCoordinateY         float = NULL,
 @DeckCoordinateZ         float = NULL
)
AS
 SET NOCOUNT ON
DECLARE @OldParentElementID     bigint
DECLARE @CurrentLabwareState    tinyint
DECLARE @CurrentLastActionState tinyint
DECLARE @CurrentInterrupted     bit
DECLARE @CurrentAborted         bit
DECLARE @CurrentBarcode         nvarchar(255)
DECLARE @CurrentProcessedSteps  bigint
DECLARE @CurrentVolume          float
DECLARE @CurrentLabwareName     nvarchar(255)
DECLARE @CurrentParentElementID bigint
DECLARE @CurrentDeckID          bigint
DECLARE @CurrentDeckCoordinateX float
DECLARE @CurrentDeckCoordinateY float
DECLARE @CurrentDeckCoordinateZ float
BEGIN
 SELECT @Connected               = ISNULL(@Connected, 0);
 SELECT @IncrementProcessedSteps = ISNULL(@IncrementProcessedSteps, 0);
 SELECT @ClearSourceBarcodeList  = ISNULL(@ClearSourceBarcodeList, 0);
 SELECT @CurrentLabwareState = [LabwareState], @CurrentLastActionState = [LastActionState], @CurrentInterrupted = [Interrupted], @CurrentAborted = [Aborted], @CurrentBarcode = [Barcode], @CurrentProcessedSteps = [ProcessedSteps] FROM [HxLabwareRunData] WHERE [RunID] = @RunID AND [ElementID] = @ElementID;
 SELECT @CurrentVolume = [Volume], @CurrentLabwareName = [LabwareName], @CurrentParentElementID = [ParentElementID], @CurrentDeckID = [DeckID], @CurrentDeckCoordinateX = [DeckCoordinateX], @CurrentDeckCoordinateY = [DeckCoordinateY], @CurrentDeckCoordinateZ = [DeckCoordinateZ] FROM [HxLabware] WHERE [ElementID] = @ElementID;
 SELECT @OldParentElementID = @CurrentParentElementID;
 SELECT @CurrentLabwareState    = ISNULL(@LabwareState,    @CurrentLabwareState);
 SELECT @CurrentLastActionState = ISNULL(@ActionState,     @CurrentLastActionState);
 SELECT @CurrentInterrupted     = ISNULL(@Interrupted,     @CurrentInterrupted);
 SELECT @CurrentAborted         = ISNULL(@Aborted,         @CurrentAborted);
 SELECT @CurrentBarcode         = ISNULL(@Barcode,         @CurrentBarcode);
 SELECT @CurrentVolume          = ISNULL(@Volume,          @CurrentVolume);
 SELECT @CurrentLabwareName     = ISNULL(@LabwareName,     @CurrentLabwareName);
 SELECT @CurrentParentElementID = ISNULL(@ParentElementID, @CurrentParentElementID);
 SELECT @CurrentDeckID          = ISNULL(@DeckID,          @CurrentDeckID);
 SELECT @CurrentDeckCoordinateX = ISNULL(@DeckCoordinateX, @CurrentDeckCoordinateX);
 SELECT @CurrentDeckCoordinateY = ISNULL(@DeckCoordinateY, @CurrentDeckCoordinateY);
 SELECT @CurrentDeckCoordinateZ = ISNULL(@DeckCoordinateZ, @CurrentDeckCoordinateZ);
 IF (@CurrentDeckID = -1)
 BEGIN
  SELECT @CurrentDeckID = NULL;
 END
 IF (@IncrementProcessedSteps > 0)
 BEGIN
  SELECT @CurrentProcessedSteps = @CurrentProcessedSteps + 1;
 END
 ELSE IF (@IncrementProcessedSteps < 0)
 BEGIN
  SELECT @CurrentProcessedSteps = 0;
 END
 IF (@Connected = 0)
 BEGIN
  UPDATE [HxLabwareRunData] SET [LabwareState] = @CurrentLabwareState, [LastActionState] = @CurrentLastActionState, [Interrupted] = @CurrentInterrupted, [Aborted] = @CurrentAborted, [ProcessedSteps] = @CurrentProcessedSteps, [Barcode] = @CurrentBarcode WHERE [RunID] = @RunID AND [ElementID] = @ElementID;
  UPDATE [HxLabware] SET [LabwareState] = @CurrentLabwareState, [Barcode] = @CurrentBarcode, [Volume] = @CurrentVolume, [DeckID] = @CurrentDeckID, [ParentElementID] = @CurrentParentElementID, [LabwareName] = @CurrentLabwareName, [DeckCoordinateX] = @CurrentDeckCoordinateX, [DeckCoordinateY] = @CurrentDeckCoordinateY, [DeckCoordinateZ] = @CurrentDeckCoordinateZ WHERE [ElementID] = @ElementID;
  IF (@ClearSourceBarcodeList != 0)
  BEGIN
   EXEC spClearSourceBarcodeList @ElementID;
   EXEC spClearExperimentList @ElementID;
  END
  IF (@CurrentDeckID IS NULL)
  BEGIN
   EXEC spUnassignSingleLabwareFromJobs @RunID, @ElementID;
  END
 END
 ELSE
 BEGIN
  UPDATE [HxLabwareRunData] SET [LabwareState] = @CurrentLabwareState, [LastActionState] = @CurrentLastActionState, [Interrupted] = @CurrentInterrupted, [Aborted] = @CurrentAborted, [ProcessedSteps] = @CurrentProcessedSteps, [Barcode] = @CurrentBarcode WHERE [RunID] = @RunID AND [ElementID] IN (SELECT [ElementID] FROM [Labware] WHERE [ParentElementID] = @OldParentElementID);
  IF (@ClearSourceBarcodeList != 0)
  BEGIN
   EXEC spClearSourceBarcodeList @OldParentElementID;
   EXEC spClearExperimentList @OldParentElementID;
  END
  IF (@CurrentDeckID IS NULL)
  BEGIN
   EXEC spUnassignSingleLabwareFromJobs @RunID, @OldParentElementID;
  END
  UPDATE [HxLabware] SET [LabwareState] = @CurrentLabwareState, [Barcode] = @CurrentBarcode, [Volume] = @CurrentVolume, [DeckID] = @CurrentDeckID, [ParentElementID] = @CurrentParentElementID, [LabwareName] = @CurrentLabwareName, [DeckCoordinateX] = @CurrentDeckCoordinateX, [DeckCoordinateY] = @CurrentDeckCoordinateY, [DeckCoordinateZ] = @CurrentDeckCoordinateZ WHERE [ParentElementID] = @OldParentElementID;
 END
END

GO
SET QUOTED_IDENTIFIER OFF 
GO
SET ANSI_NULLS ON 
GO
%%%SWITCH_END_CREATE_DATABASE%%%

%%%SWITCH_BEGIN_CREATE_LOGIN%%%
-- Add login Hamilton
EXEC sp_addlogin '%%%VARIABLE_USERNAME%%%', '%%%VARIABLE_PASSWORD%%%', %%%VARIABLE_DBNAME%%%, NULL, %%%VARIABLE_SID%%%
GO
%%%SWITCH_END_CREATE_LOGIN%%%

%%%SWITCH_BEGIN_CHANGE_DBOWNER%%%
-- Change the owner of the database to Hamilton
EXEC sp_changedbowner '%%%VARIABLE_USERNAME%%%'
GO
%%%SWITCH_END_CHANGE_DBOWNER%%%

%%%SWITCH_BEGIN_UPDATE_LOGIN_LOCAL_SERVER%%%
-- Add new login Hamilton to the role dbcreator
EXEC sp_addsrvrolemember '%%%VARIABLE_USERNAME%%%', 'dbcreator'
EXEC sp_addsrvrolemember '%%%VARIABLE_USERNAME%%%', 'sysadmin'
GO
%%%SWITCH_END_UPDATE_LOGIN_LOCAL_SERVER%%%
-- $$author=ContainerAdministrator$$valid=1$$time=2025-09-09 19:47$$checksum=1de93b3b$$length=099$$