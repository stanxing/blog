# MongoDB 索引

## MongoDB 测试表的 schema

    ```js
    {
        "index": string,
        "accountId": string,
        "memberId": string,
        "cardId": string,
    }
    ```

    ```js
    // 插入测试数据
    for (var i = 1; i <= 90000; i++) {
        db.test.insert({ index : i , 
                name: "name"+ i , 
                accountId:"accountId" + i, 
                cardId:"cardId" + i, 
                memberId:"memberId" + i,
            })
    }
    ```

## $or

官方文档中提到 https://docs.mongodb.com/manual/reference/operator/query/or/#or-clauses-and-indexes ，对于为包含 $or 的文档创建索引，应为 $or 中 每一个查询子句都创建索引。

### example1

    ```js
    // query 语句
    db.test.find(
        {
            "$or":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId123","cardId456","cardId789"]}}
            ]
        }
    ).explain().queryPlanner.winningPlan
    ```

    测试发现，该例子中需要创建的索引为 {accountId:1} 和 {cardId:1} 两个，不可以创建一个复合索引 {accountId:1, cardId:1}

    ```js
    // 创建 {accountId:1} 和 {cardId:1} 之后的 explain 结果如下，可以发现两个查询条件都正常命中索引
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "FETCH",
            "inputStage" : {
                "stage" : "OR",
                "inputStages" : [
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1
                        },
                        "indexName" : "accountId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1
                        },
                        "indexName" : "cardId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId123\", \"cardId123\"]",
                                "[\"cardId456\", \"cardId456\"]",
                                "[\"cardId789\", \"cardId789\"]"
                            ]
                        }
                    }
                ]
            }
        }
    }

    // 使用 hint 指定 {accountId:1, cardId:1} 索引测试如下：
    db.test.find(
        {
            "$or":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId123","cardId456","cardId789"]}}
            ]
        }
    ).hint({accountId:1, cardId:1}).explain().queryPlanner.winningPlan

    // 结果分析发现相当于没有索引，执行了全表扫描：
    {
        "stage" : "FETCH",
        "filter" : {
            "$or" : [
                {
                    "accountId" : {
                        "$eq" : "accountId100"
                    }
                },
                {
                    "cardId" : {
                        "$in" : [
                            "cardId123",
                            "cardId456",
                            "cardId789"
                        ]
                    }
                }
            ]
        },
        "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
                "accountId" : 1,
                "cardId" : 1
            },
            "indexName" : "accountId_1_cardId_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
                "accountId" : [
                    "[MinKey, MaxKey]"
                ],
                "cardId" : [
                    "[MinKey, MaxKey]"
                ]
            }
        }
    }
    ```

### example2

    ```js
    // 若查询条件包含 sort
    db.test.find(
        {
            "$or":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId123","cardId456","cardId789"]}}
            ]
        }
    ).sort({"index":1}).explain().queryPlanner.winningPlan
    ```

    表中保留 {accountId:1} 和 {cardId:1} 两个索引，测试发现，过滤阶段正常命中索引，但排序阶段是 `SORT_KEY_GENERATOR`，意味着在内存做的排序

    ```js
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "SORT",
            "sortPattern" : {
                "index" : 1
            },
            "inputStage" : {
                "stage" : "SORT_KEY_GENERATOR",
                "inputStage" : {
                    "stage" : "FETCH",
                    "inputStage" : {
                        "stage" : "OR",
                        "inputStages" : [
                            {
                                "stage" : "IXSCAN",
                                "keyPattern" : {
                                    "accountId" : 1,
                                    "cardId" : 1
                                },
                                "indexName" : "accountId_1_cardId_1",
                                "isMultiKey" : false,
                                "isUnique" : false,
                                "isSparse" : false,
                                "isPartial" : false,
                                "indexVersion" : 1,
                                "direction" : "forward",
                                "indexBounds" : {
                                    "accountId" : [
                                        "[\"accountId100\", \"accountId100\"]"
                                    ],
                                    "cardId" : [
                                        "[MinKey, MaxKey]"
                                    ]
                                }
                            },
                            {
                                "stage" : "IXSCAN",
                                "keyPattern" : {
                                    "cardId" : 1
                                },
                                "indexName" : "cardId_1",
                                "isMultiKey" : false,
                                "isUnique" : false,
                                "isSparse" : false,
                                "isPartial" : false,
                                "indexVersion" : 1,
                                "direction" : "forward",
                                "indexBounds" : {
                                    "cardId" : [
                                        "[\"cardId123\", \"cardId123\"]",
                                        "[\"cardId456\", \"cardId456\"]",
                                        "[\"cardId789\", \"cardId789\"]"
                                    ]
                                }
                            }
                        ]
                    }
                }
            }
        }
    }
    ```

    分别创建索引 {accountId:1,index:1} 和 {cardId:1, index:1}，重新执行 explain，结果显示，排序阶段变成了 `SORT_MERGE`， 而且在 `fetch` 之前，说明 sort 已经命中索引

    ```js
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "FETCH",
            "inputStage" : {
                "stage" : "SORT_MERGE",
                "sortPattern" : {
                    "index" : 1
                },
                "inputStages" : [
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1,
                            "index" : 1
                        },
                        "indexName" : "accountId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId123\", \"cardId123\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId456\", \"cardId456\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId789\", \"cardId789\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    }
                ]
            }
        }
    }
    ```

### example3

    ```js
    db.test.find(
        {
            "$or":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId123","cardId456","cardId789"]}}
            ],
            "memberId":"memberId140"
        }
    ).sort({"index":1}).explain().queryPlanner.winningPlan
    
    ```
    当不存在 {memberId:1,index:1} 时，查询可以命中 {accountId:1,index:1} 和 {cardId:1,index:1} ，但是仅仅命中了过滤条件，没有命中排序。

    {memberId:1,index:1} 命中了外层的过滤条件和排序。

    {accountId:1,memberId:1,index:1} 和 {cardId:1,memberId,index:1} 无法命中

    ```js
    // {accountId:1,index:1} 和 {cardId:1,index:1},
    {
        "stage" : "SORT",
        "sortPattern" : {
            "index" : 1
        },
        "inputStage" : {
            "stage" : "SORT_KEY_GENERATOR",
            "inputStage" : {
                "stage" : "FETCH",
                "filter" : {
                    "memberId" : {
                        "$eq" : "memberId140"
                    }
                },
                "inputStage" : {
                    "stage" : "OR",
                    "inputStages" : [
                        {
                            "stage" : "IXSCAN",
                            "keyPattern" : {
                                "cardId" : 1,
                                "index" : 1
                            },
                            "indexName" : "cardId_1_index_1",
                            "isMultiKey" : false,
                            "isUnique" : false,
                            "isSparse" : false,
                            "isPartial" : false,
                            "indexVersion" : 1,
                            "direction" : "forward",
                            "indexBounds" : {
                                "cardId" : [
                                    "[\"cardId123\", \"cardId123\"]",
                                    "[\"cardId456\", \"cardId456\"]",
                                    "[\"cardId789\", \"cardId789\"]"
                                ],
                                "index" : [
                                    "[MinKey, MaxKey]"
                                ]
                            }
                        },
                        {
                            "stage" : "IXSCAN",
                            "keyPattern" : {
                                "accountId" : 1,
                                "index" : 1
                            },
                            "indexName" : "accountId_1_index_1",
                            "isMultiKey" : false,
                            "isUnique" : false,
                            "isSparse" : false,
                            "isPartial" : false,
                            "indexVersion" : 1,
                            "direction" : "forward",
                            "indexBounds" : {
                                "accountId" : [
                                    "[\"accountId100\", \"accountId100\"]"
                                ],
                                "index" : [
                                    "[MinKey, MaxKey]"
                                ]
                            }
                        }
                    ]
                }
            }
        }
    }

    //  {memberId:1,index:1}
    {
        "stage" : "FETCH",
        "filter" : {
            "$or" : [
                {
                    "accountId" : {
                        "$eq" : "accountId100"
                    }
                },
                {
                    "cardId" : {
                        "$in" : [
                            "cardId123",
                            "cardId456",
                            "cardId789"
                        ]
                    }
                }
            ]
        },
        "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
                "memberId" : 1,
                "index" : 1
            },
            "indexName" : "memberId_1_index_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
                "memberId" : [
                    "[\"memberId140\", \"memberId140\"]"
                ],
                "index" : [
                    "[MinKey, MaxKey]"
                ]
            }
        }
    }
    ```

## $and

$and 的索引执行情况没有文档介绍，下面是一些实际测试结果

### example1

    ```js
    db.test.find(
        {
            "$and":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
            ]
        }
    ).explain().queryPlanner.winningPlan
    
    ```

    创建 {accountId:1,cardId:1} 索引后再次执行上述命令，发现两个字段都命中了索引

    ```js
    {
        "stage" : "FETCH",
        "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
                "accountId" : 1,
                "cardId" : 1
            },
            "indexName" : "accountId_1_cardId_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
                "accountId" : [
                    "[\"accountId100\", \"accountId100\"]"
                ],
                "cardId" : [
                    "[\"cardId100\", \"cardId100\"]",
                    "[\"cardId456\", \"cardId456\"]",
                    "[\"cardId789\", \"cardId789\"]"
                ]
            }
        }
    }
    ```

### example2

    ```js
    // 若查询条件包含 sort
    db.test.find(
        {
            "$and":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
            ]
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```

    创建 {accountId:1,cardId:1,index:1}，发现全部命中索引：

    ```js
    {
        "stage" : "FETCH",
        "inputStage" : {
            "stage" : "SORT_MERGE",
            "sortPattern" : {
                "index" : 1
            },
            "inputStages" : [
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId100\", \"cardId100\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                },
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId456\", \"cardId456\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                },
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId789\", \"cardId789\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                }
            ]
        }
    }
    ```

### example3

    ```js
    // 若查询条件不只包含 $and
    db.test.find(
        {
            "$and":[
                {"accountId":"accountId100"},
                {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
            ],
            "memberId": "memberId100"
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```

    创建索引 {accountId:1,cardId:1,memberId:1,index:1}, 测试发现成功命中

    ```js
    {
        "stage" : "FETCH",
        "inputStage" : {
            "stage" : "SORT_MERGE",
            "sortPattern" : {
                "index" : 1
            },
            "inputStages" : [
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "memberId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_memberId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId100\", \"cardId100\"]"
                        ],
                        "memberId" : [
                            "[\"memberId100\", \"memberId100\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                },
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "memberId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_memberId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId456\", \"cardId456\"]"
                        ],
                        "memberId" : [
                            "[\"memberId100\", \"memberId100\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                },
                {
                    "stage" : "IXSCAN",
                    "keyPattern" : {
                        "accountId" : 1,
                        "cardId" : 1,
                        "memberId" : 1,
                        "index" : 1
                    },
                    "indexName" : "accountId_1_cardId_1_memberId_1_index_1",
                    "isMultiKey" : false,
                    "isUnique" : false,
                    "isSparse" : false,
                    "isPartial" : false,
                    "indexVersion" : 1,
                    "direction" : "forward",
                    "indexBounds" : {
                        "accountId" : [
                            "[\"accountId100\", \"accountId100\"]"
                        ],
                        "cardId" : [
                            "[\"cardId789\", \"cardId789\"]"
                        ],
                        "memberId" : [
                            "[\"memberId100\", \"memberId100\"]"
                        ],
                        "index" : [
                            "[MinKey, MaxKey]"
                        ]
                    }
                }
            ]
        }
    }
    ```

## $and 和 $or 嵌套查询

### $or 中包含 $or

#### example1

    ```js
    db.test.find(
        {
            "$or":[
                {
                    "$or":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                }
            ]
        }
    ).explain().queryPlanner.winningPlan
    ```

    依旧可以命中 {accountdId:1} 和 {cardId:1}

    ```js
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "FETCH",
            "inputStage" : {
                "stage" : "OR",
                "inputStages" : [
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1
                        },
                        "indexName" : "cardId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId100\", \"cardId100\"]",
                                "[\"cardId456\", \"cardId456\"]",
                                "[\"cardId789\", \"cardId789\"]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1
                        },
                        "indexName" : "accountId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ]
                        }
                    }
                ]
            }
        }
    }
    ```

#### example2

    ```js
    // 相比上一个查询条件，多了 {"memberId":"memberId101"}
    db.test.find(
        {
            "$or":[
                {
                    "$or":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "memberId":"memberId101"
                }
            ]
        }
    ).explain().queryPlanner.winningPlan
    ```

    必须这三个索引都存在时才能命中索引，{accountId:1} {cardId：1} 和 {memberId:1} ，所以上面这种写法其实和一个 `$or` 中包含 3 个查询条件没有区别

    ```js
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "FETCH",
            "inputStage" : {
                "stage" : "OR",
                "inputStages" : [
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "cardId" : 1
                        },
                        "indexName" : "cardId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "cardId" : [
                                "[\"cardId100\", \"cardId100\"]",
                                "[\"cardId456\", \"cardId456\"]",
                                "[\"cardId789\", \"cardId789\"]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1
                        },
                        "indexName" : "accountId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "memberId" : 1
                        },
                        "indexName" : "memberId_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "memberId" : [
                                "[\"memberId101\", \"memberId101\"]"
                            ]
                        }
                    }
                ]
            }
        }
    }
    ```

### $or 中包含 $and

#### example1

    ```js
    db.test.find(
        {
            "$or":[
                {
                    "$and":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                }
            ]
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```
    可以命中 {accountId:1,cardId:1,index:1}

#### example2

    ```js
    db.test.find(
        {
            "$or":[
                {
                    "$and":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "memberId":"memberId140"
                }
            ]
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```
    最合适的索引应该为 {accountId:1,cardId:1,index:1} 和 {member:1,index:1},所有字段均可命中

    ```js
    {
        "stage" : "SUBPLAN",
        "inputStage" : {
            "stage" : "FETCH",
            "inputStage" : {
                "stage" : "SORT_MERGE",
                "sortPattern" : {
                    "index" : 1
                },
                "inputStages" : [
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1,
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "accountId_1_cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ],
                            "cardId" : [
                                "[\"cardId100\", \"cardId100\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1,
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "accountId_1_cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ],
                            "cardId" : [
                                "[\"cardId456\", \"cardId456\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "accountId" : 1,
                            "cardId" : 1,
                            "index" : 1
                        },
                        "indexName" : "accountId_1_cardId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "accountId" : [
                                "[\"accountId100\", \"accountId100\"]"
                            ],
                            "cardId" : [
                                "[\"cardId789\", \"cardId789\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    },
                    {
                        "stage" : "IXSCAN",
                        "keyPattern" : {
                            "memberId" : 1,
                            "index" : 1
                        },
                        "indexName" : "memberId_1_index_1",
                        "isMultiKey" : false,
                        "isUnique" : false,
                        "isSparse" : false,
                        "isPartial" : false,
                        "indexVersion" : 1,
                        "direction" : "forward",
                        "indexBounds" : {
                            "memberId" : [
                                "[\"memberId140\", \"memberId140\"]"
                            ],
                            "index" : [
                                "[MinKey, MaxKey]"
                            ]
                        }
                    }
                ]
            }
        }
    }

    ```

### $and 中包含 $and

#### example1

    ```js
    db.test.find(
        {
            "$and":[
                {
                    "$and":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                }
            ]
        }
    ).hint({accountId:1,cardId:1}).explain().queryPlanner.winningPlan
    ```

    使用 hint() 指定 {accountId:1,cardId:1} 发现可以命中该索引，使用 hint 的原因是默认选择了 {accountId:1},默认行为的原因应该是因为 accountId 已经把文档过滤的只剩下一条了，不需要第 2 个字段的索引

    ```js
    {
        "stage" : "FETCH",
        "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
                "accountId" : 1,
                "cardId" : 1
            },
            "indexName" : "accountId_1_cardId_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
                "accountId" : [
                    "[\"accountId100\", \"accountId100\"]"
                ],
                "cardId" : [
                    "[\"cardId100\", \"cardId100\"]",
                    "[\"cardId456\", \"cardId456\"]",
                    "[\"cardId789\", \"cardId789\"]"
                ]
            }
        }
    }
    ```

#### example2

    ```js
    db.test.find(
        {
            "$and":[
                {
                    "$and":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "memberId":"memberId100"
                }
            ]
        }
    ).hint({accountId:1,cardId:1,memberId:1}).explain().queryPlanner.winningPlan
    ```

    {accountId:1,cardId:1,memberId:1} 索引可以完全命中，行为与 一个 $and 中包含 3 个查询条件的查询完全一致 

    ```js
    {
        "stage" : "FETCH",
        "inputStage" : {
            "stage" : "IXSCAN",
            "keyPattern" : {
                "accountId" : 1,
                "cardId" : 1,
                "memberId" : 1
            },
            "indexName" : "accountId_1_cardId_1_memberId_1",
            "isMultiKey" : false,
            "isUnique" : false,
            "isSparse" : false,
            "isPartial" : false,
            "indexVersion" : 1,
            "direction" : "forward",
            "indexBounds" : {
                "accountId" : [
                    "[\"accountId100\", \"accountId100\"]"
                ],
                "cardId" : [
                    "[\"cardId100\", \"cardId100\"]",
                    "[\"cardId456\", \"cardId456\"]",
                    "[\"cardId789\", \"cardId789\"]"
                ],
                "memberId" : [
                    "[\"memberId100\", \"memberId100\"]"
                ]
            }
        }
    }

    ```

### $and 中包含 $or

#### example1

    ```js
    db.test.find(
        {
            "$and":[
                {
                    "$or":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "memberId":"memberId100"
                }
            ]
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```
    行为与 $or 中的 example3 是一样的
    可以命中 {memberId:1,index:1} 也可以命中 {accountId:1,cardId:1}
    无法命中 {accountId:1,memberId:1,index:1} 或者 {cardId:1,memberId:1,index:1}

#### example2

    ```js
    db.test.find(
        {
            "$and":[
                {
                    "$or":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "$or":[
                        {"memberId":"memberId100"},
                    ]
                }
            ]
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```

    行为与 example1 是一样的
    可以命中 {accountId:1} 和 {cardId:1} 和 {memberId:1}

#### example3

    ```js
    db.test.find(
        {
            "$and":[
                {
                    "$or":[
                        {"accountId":"accountId100"},
                        {"cardId": {"$in":["cardId100","cardId456","cardId789"]}}
                    ]
                },
                {
                    "memberId":"memberId100"
                }
            ],
            "name": "name100"
        }
    ).sort({index:1}).explain().queryPlanner.winningPlan
    ```

    可以命中 {memberId:1,name:1,index:1}

## 结论

- 对于包含 $or 和 $and 的索引，创建方式为：
    - 只包含 $or ，则拆分查询子句，分别为每个子句创建索引
    - 只包含 $and，则将查询子句以及和 $and 并列的查询字段合并起来建一个索引
    - 若 $and 嵌套 $or , $or 部分遵循 $or 的逻辑，剩余字段合起来建一个索引
    - 若 sort 存在，为每个索引都拼接上 sort 的字段
